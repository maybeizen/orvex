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

func isBlockedProbeIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
		return true
	}
	if ip.Equal(net.ParseIP("fd00:ec2::254")) || ip.Equal(net.ParseIP("100.100.100.200")) {
		return true
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

func guardResolved(ctx context.Context, host string) error {
	if err := rejectProbeTarget(host); err != nil {
		return err
	}
	if net.ParseIP(host) != nil {
		return nil
	}
	ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return err
	}
	for _, item := range ips {
		if isBlockedProbeIP(item.IP) {
			return errBlockedTarget
		}
	}
	return nil
}
