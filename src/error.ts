import debug from "debug";

function handleError(error: any) {
    const logger = debug("unporter:error");
    logger(error);

    console.error("An unknown error occurred. Failed to generate Markdown report.");
    process.exit(1);
}

export function onUncaughtException(error: Error) {
    handleError(error);
}

export function onUnhandledRejection(reason: {} | null | undefined, promise: Promise<any>) {
    handleError(reason);
}
