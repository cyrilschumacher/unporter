import { Command } from "commander";

import debug from "debug";

interface Options {
    branch: string;
    debug: boolean;
    out?: string;
}

function createProgram() {
    return new Command()
        .version("0.0.1")
        .description("Generate a Markdown file according to conventional Git commits.")
        .option("-b, --branch <branch>", "specify the parent branch.", "master")
        .option("-o, --out <file>", "specify the output file.")
        .option("--debug", "enable debug mode.", false) as Command;
}

export function parseOptions(argv: string[]) {
    const program = createProgram();
    program.parse(argv);

    const options = program.opts();
    if (options.debug) {
        debug.enable("unporter,unporter:*,simple-git,simple-git:*");
    }

    return options as Options;
}

export async function main() {
    const options = parseOptions(process.argv);
}