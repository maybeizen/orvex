package security

import (
	"errors"
	"fmt"
	"os"
)

var ErrRootRefused = errors.New("security: refusing to run as root")

var effectiveUID = os.Geteuid

func RunningAsRoot() bool {
	return effectiveUID() == 0
}

func RefuseRoot(runAsRoot bool) error {
	if RunningAsRoot() && !runAsRoot {
		return fmt.Errorf("%w: set run_as_root: true to override", ErrRootRefused)
	}
	return nil
}
