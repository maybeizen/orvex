//go:build !linux

package security

func DropCapabilities() error {
	return nil
}
