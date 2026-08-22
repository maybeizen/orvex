package config

import (
	"bytes"
	"errors"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Mode string

const (
	ModeDaemon Mode = "daemon"
	ModeCron   Mode = "cron"
)

const (
	EnvToken  = "ORVEX_AGENT_TOKEN"
	EnvAPIURL = "ORVEX_API_URL"
	EnvID     = "ORVEX_AGENT_ID"

	DefaultConfigPath = "configs/agent.example.yml"
	DefaultInterval   = 30 * time.Second
)

var (
	ErrInvalidMode = errors.New("config: mode must be daemon or cron")
	ErrMissing     = errors.New("config: missing required field")
)

type Config struct {
	Mode      Mode
	APIURL    string
	AgentID   string
	Token     string
	RunAsRoot bool
	Interval  time.Duration
}

type Options struct {
	ConfigPath string
	Mode       Mode
}

type fileConfig struct {
	Mode      string
	APIURL    string
	AgentID   string
	Token     string
	RunAsRoot bool
}

func (m Mode) Valid() error {
	switch m {
	case ModeDaemon, ModeCron:
		return nil
	default:
		return fmt.Errorf("%w: %q", ErrInvalidMode, m)
	}
}

func ParseFlags(args []string) (Options, error) {
	fs := flag.NewFlagSet("orvex-agent", flag.ContinueOnError)
	var buf bytes.Buffer
	fs.SetOutput(&buf)

	configPath := fs.String("config", DefaultConfigPath, "path to YAML config")
	mode := fs.String("mode", "", "override run mode: daemon or cron")

	if err := fs.Parse(args); err != nil {
		return Options{}, err
	}

	opts := Options{ConfigPath: *configPath}
	if *mode != "" {
		opts.Mode = Mode(*mode)
		if err := opts.Mode.Valid(); err != nil {
			return Options{}, err
		}
	}

	return opts, nil
}

func ParseFile(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Config{}, fmt.Errorf("config: read %s: %w", path, err)
	}

	raw, err := parseYAML(data)
	if err != nil {
		return Config{}, fmt.Errorf("config: parse %s: %w", path, err)
	}

	return Config{
		Mode:      Mode(raw.Mode),
		APIURL:    raw.APIURL,
		AgentID:   raw.AgentID,
		Token:     raw.Token,
		RunAsRoot: raw.RunAsRoot,
		Interval:  DefaultInterval,
	}, nil
}

func parseYAML(data []byte) (fileConfig, error) {
	var raw fileConfig
	for i, line := range strings.Split(string(data), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		key, val, ok := strings.Cut(trimmed, ":")
		if !ok {
			return fileConfig{}, fmt.Errorf("invalid line %d", i+1)
		}
		key = strings.TrimSpace(key)
		val = unquote(strings.TrimSpace(val))
		switch key {
		case "mode":
			raw.Mode = val
		case "api_url":
			raw.APIURL = val
		case "agent_id":
			raw.AgentID = val
		case "token":
			raw.Token = val
		case "run_as_root":
			parsed, err := strconv.ParseBool(val)
			if err != nil {
				return fileConfig{}, fmt.Errorf("run_as_root: %w", err)
			}
			raw.RunAsRoot = parsed
		default:
			return fileConfig{}, fmt.Errorf("unknown key %q", key)
		}
	}
	return raw, nil
}

func unquote(val string) string {
	if len(val) >= 2 {
		if (val[0] == '"' && val[len(val)-1] == '"') || (val[0] == '\'' && val[len(val)-1] == '\'') {
			return val[1 : len(val)-1]
		}
	}
	return val
}

func OverlayEnv(cfg Config, getenv func(string) string) Config {
	if getenv == nil {
		return cfg
	}
	if v := getenv(EnvToken); v != "" {
		cfg.Token = v
	}
	if v := getenv(EnvAPIURL); v != "" {
		cfg.APIURL = v
	}
	if v := getenv(EnvID); v != "" {
		cfg.AgentID = v
	}
	return cfg
}

func (c Config) Validate() error {
	if err := c.Mode.Valid(); err != nil {
		return err
	}
	if c.APIURL == "" {
		return fmt.Errorf("%w: api_url", ErrMissing)
	}
	if c.AgentID == "" {
		return fmt.Errorf("%w: agent_id", ErrMissing)
	}
	if c.Token == "" {
		return fmt.Errorf("%w: token", ErrMissing)
	}
	if c.Interval <= 0 {
		return fmt.Errorf("%w: interval", ErrMissing)
	}
	return nil
}

func Load(path string, getenv func(string) string) (Config, error) {
	cfg, err := ParseFile(path)
	if err != nil {
		return Config{}, err
	}
	cfg = OverlayEnv(cfg, getenv)
	if cfg.Interval <= 0 {
		cfg.Interval = DefaultInterval
	}
	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}
