use clap::{Parser, Subcommand};

/// Demo CLI used as a help2md test fixture.
#[derive(Parser)]
#[command(name = "clapdemo", version)]
struct Cli {
    /// Increase verbosity
    #[arg(short, long, global = true)]
    verbose: bool,
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Manage configuration
    Config {
        #[command(subcommand)]
        command: ConfigCommand,
    },
    /// Run the thing
    #[command(visible_alias = "r")]
    Run {
        /// Target to run
        target: String,
        /// Number of times
        #[arg(short, long, default_value_t = 1)]
        count: u32,
    },
    /// Internal debugging
    #[command(hide = true)]
    Debug,
}

#[derive(Subcommand)]
enum ConfigCommand {
    /// Print a config value; the description is long on purpose so that clap wraps it at the fixed width
    Get { key: String },
    /// Set a config value
    #[command(visible_alias = "put")]
    Set { key: String, value: String },
}

fn main() {
    let _ = Cli::parse();
}
