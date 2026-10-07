package check

import (
	"context"
	"errors"
	"net"
	"strings"
)

var errBlockedTarget = errors.New("blocked target")

func isMetadataHostname(host string) bool {
	host = strings.TrimSuffix(strings.ToLower(strings.TrimSpace(host)), ".")
	switch host {
	case "metadata", "metadata.google.internal", "metadata.google.com", "instance-data":
		return true
	default:
		return strings.HasSuffix(host, ".metadata.google.internal")
	}
}

func embeddedProbeIPv4(ip net.IP) net.IP {
	ip = ip.To16()
	if ip == nil || ip.To4() != nil {
		return nil
	}
	if ip[0] == 0x20 && ip[1] == 0x02 {
		return net.IPv4(ip[2], ip[3], ip[4], ip[5])
	}
	if ip[0] == 0x00 && ip[1] == 0x64 && ip[2] == 0xff && ip[3] == 0x9b &&
		ip[4] == 0 && ip[5] == 0 && ip[6] == 0 && ip[7] == 0 &&
		ip[8] == 0 && ip[9] == 0 && ip[10] == 0 && ip[11] == 0 {
		return net.IPv4(ip[12], ip[13], ip[14], ip[15])
	}
	return nil
}

func isLocalNAT64(ip net.IP) bool {
	ip = ip.To16()
	return ip != nil && ip.To4() == nil &&
		ip[0] == 0x00 && ip[1] == 0x64 && ip[2] == 0xff && ip[3] == 0x9b &&
		ip[4] == 0x00 && ip[5] == 0x01
}

func isTeredo(ip net.IP) bool {
	ip = ip.To16()
	return ip != nil && ip.To4() == nil && ip[0] == 0x20 && ip[1] == 0x01 && ip[2] == 0 && ip[3] == 0
}

func compatibleIPv4(ip net.IP) net.IP {
	ip = ip.To16()
	if ip == nil || ip.To4() != nil {
		return nil
	}
	for i := 0; i < 12; i++ {
		if ip[i] != 0 {
			return nil
		}
	}
	if ip[12] == 0 && ip[13] == 0 && ip[14] == 0 && ip[15] == 0 {
		return nil
	}
	return net.IPv4(ip[12], ip[13], ip[14], ip[15])
}

func isBlockedProbeIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
		return true
	}
	if ip.Equal(net.ParseIP("fd00:ec2::254")) ||
		ip.Equal(net.ParseIP("100.100.100.200")) ||
		ip.Equal(net.ParseIP("168.63.129.16")) {
		return true
	}
	if isLocalNAT64(ip) || isTeredo(ip) {
		return true
	}
	if embedded := embeddedProbeIPv4(ip); embedded != nil {
		return isBlockedProbeIP(embedded)
	}
	if embedded := compatibleIPv4(ip); embedded != nil {
		return isBlockedProbeIP(embedded)
	}
	return false
}

func rejectProbeTarget(host string) error {
	host = strings.TrimSpace(host)
	if host == "" || strings.HasPrefix(host, "-") || isMetadataHostname(host) {
		return errBlockedTarget
	}
	if ip := net.ParseIP(host); ip != nil && isBlockedProbeIP(ip) {
		return errBlockedTarget
	}
	return nil
}

var lookupIPAddr = func(ctx context.Context, host string) ([]net.IPAddr, error) {
	return net.DefaultResolver.LookupIPAddr(ctx, host)
}

func vettedIPs(ctx context.Context, host string) ([]net.IP, error) {
	host = strings.Trim(strings.TrimSpace(host), "[]")
	if err := rejectProbeTarget(host); err != nil {
		return nil, err
	}
	if ip := net.ParseIP(host); ip != nil {
		return []net.IP{ip}, nil
	}
	resolved, err := lookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	if len(resolved) == 0 {
		return nil, errBlockedTarget
	}
	ips := make([]net.IP, 0, len(resolved))
	for _, item := range resolved {
		if isBlockedProbeIP(item.IP) {
			return nil, errBlockedTarget
		}
		ips = append(ips, item.IP)
	}
	return ips, nil
}

func guardResolved(ctx context.Context, host string) error {
	_, err := vettedIPs(ctx, host)
	return err
}

func dialPinned(ctx context.Context, dialer *net.Dialer, network, host, port string) (net.Conn, error) {
	ips, err := vettedIPs(ctx, host)
	if err != nil {
		return nil, err
	}
	var last error
	for _, ip := range ips {
		conn, dialErr := dialer.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
		if dialErr == nil {
			return conn, nil
		}
		last = dialErr
	}
	if last == nil {
		return nil, errBlockedTarget
	}
	return nil, last
}
