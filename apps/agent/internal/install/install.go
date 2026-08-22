package install

import (
	"bytes"
	"flag"
	"fmt"
	"os"

	"github.com/orvex/agent/internal/config"
)

func Run(args []string) error {
	fs := flag.NewFlagSet("orvex-agent install", flag.ContinueOnError)
	var buf bytes.Buffer
	fs.SetOutput(&buf)

	token := fs.String("token", "", "heartbeat monitor token issued at install")
	agentID := fs.String("id", "", "heartbeat monitor id")
	apiURL := fs.String("api-url", "", "Orvex API base URL")
	configPath := fs.String("config", config.DefaultConfigPath, "path to write agent config")
	mode := fs.String("mode", string(config.ModeDaemon), "run mode: daemon or cron")
	runAsRoot := fs.Bool("run-as-root", false, "allow running as root")

	if err := fs.Parse(args); err != nil {
		return err
	}

	cfg := config.Config{
		Mode:      config.Mode(*mode),
		APIURL:    *apiURL,
		AgentID:   *agentID,
		Token:     *token,
		RunAsRoot: *runAsRoot,
		Interval:  config.DefaultInterval,
	}

	if err := config.WriteFile(*configPath, cfg); err != nil {
		return err
	}

	fmt.Fprintf(os.Stdout, "wrote %s\n", *configPath)
	return nil
}
