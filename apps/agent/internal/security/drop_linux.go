//go:build linux

package security

import (
	"syscall"
	"unsafe"
)

const (
	linuxCapLast            = 40
	prSetNoNewPrivs         = 38
	prCapbsetDrop           = 24
	prCapAmbient            = 47
	prCapAmbientClearAll    = 4
	linuxCapabilityVersion3 = 0x20080522
)

type capHeader struct {
	version uint32
	pid     int32
}

type capData struct {
	effective   uint32
	permitted   uint32
	inheritable uint32
}

func prctl(option, arg2, arg3, arg4 uintptr) error {
	_, _, errno := syscall.RawSyscall6(syscall.SYS_PRCTL, option, arg2, arg3, arg4, 0, 0)
	if errno != 0 {
		return errno
	}
	return nil
}

func ignoreCapErr(err error) error {
	if err == nil {
		return nil
	}
	if err == syscall.EPERM || err == syscall.EINVAL || err == syscall.EACCES {
		return nil
	}
	return err
}

func DropCapabilities() error {
	if err := prctl(prSetNoNewPrivs, 1, 0, 0); err != nil {
		return err
	}
	for capn := uintptr(0); capn <= linuxCapLast; capn++ {
		if err := ignoreCapErr(prctl(prCapbsetDrop, capn, 0, 0)); err != nil {
			return err
		}
	}
	if err := ignoreCapErr(prctl(prCapAmbient, prCapAmbientClearAll, 0, 0)); err != nil {
		return err
	}
	hdr := capHeader{version: linuxCapabilityVersion3}
	var data [2]capData
	_, _, errno := syscall.RawSyscall(
		syscall.SYS_CAPSET,
		uintptr(unsafe.Pointer(&hdr)),
		uintptr(unsafe.Pointer(&data[0])),
		0,
	)
	if errno != 0 {
		return ignoreCapErr(errno)
	}
	return nil
}
