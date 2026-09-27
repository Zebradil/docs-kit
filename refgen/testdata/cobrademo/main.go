package main

import (
	"os"

	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{Use: "cobrademo", Short: "Demo CLI used as a help2md test fixture."}
	root.PersistentFlags().BoolP("verbose", "v", false, "increase verbosity")

	config := &cobra.Command{Use: "config", Short: "Manage configuration"}
	config.AddCommand(
		&cobra.Command{Use: "get <key>", Short: "Print a config value", Run: func(*cobra.Command, []string) {}},
		&cobra.Command{Use: "set <key> <value>", Aliases: []string{"put"}, Short: "Set a config value", Run: func(*cobra.Command, []string) {}},
	)
	run := &cobra.Command{Use: "run <target>", Aliases: []string{"r"}, Short: "Run the thing", Run: func(*cobra.Command, []string) {}}
	run.Flags().IntP("count", "c", 1, "number of times")
	debug := &cobra.Command{Use: "debug", Short: "Internal debugging", Hidden: true, Run: func(*cobra.Command, []string) {}}
	root.AddCommand(config, run, debug)

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}
