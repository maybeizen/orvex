package check

import (
	"net"
	"net/url"
	"strconv"
	"strings"
)

func ensureURL(target string) string {
	target = strings.TrimSpace(target)
	if target == "" {
		return target
	}
	if strings.Contains(target, "://") {
		return target
	}
	return "https://" + target
}

func hostFromTarget(target string) string {
	target = strings.TrimSpace(target)
	if target == "" {
		return ""
	}
	if strings.Contains(target, "://") {
		u, err := url.Parse(target)
		if err == nil && u.Hostname() != "" {
			return u.Hostname()
		}
	}
	if host, _, err := net.SplitHostPort(target); err == nil {
		return host
	}
	if i := strings.IndexAny(target, "/"); i >= 0 {
		target = target[:i]
	}
	return target
}

func portFromTarget(target string, fallback int) int {
	if fallback > 0 {
		return fallback
	}
	target = strings.TrimSpace(target)
	if strings.Contains(target, "://") {
		u, err := url.Parse(target)
		if err == nil && u.Port() != "" {
			if p, err := strconv.Atoi(u.Port()); err == nil {
				return p
			}
		}
		return fallback
	}
	if _, port, err := net.SplitHostPort(target); err == nil {
		if p, err := strconv.Atoi(port); err == nil {
			return p
		}
	}
	return fallback
}
