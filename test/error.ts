import * as chai from "chai";
import * as sinon from "sinon";

import { onUncaughtException, onUnhandledRejection } from "../src/error";

describe("error", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => (sandbox = sinon.createSandbox()));
    afterEach(() => sandbox.restore());

    it("should print an error for an exception", () => {
        // Given
        const consoleErrorStub = sandbox.stub(console, "error");
        const processExitStub = sandbox.stub(process, "exit");

        const error = new SyntaxError(
            "Invalid regular expression: /^(feat)(((?scope>.*)))?(?<breaking>!)?: (?<description>.*)/: Invalid group",
        );

        // When
        onUncaughtException(error);

        // Then
        chai.expect(consoleErrorStub).to.have.been.calledWith(
            "An unknown error occurred. Failed to generate Markdown report.",
        );
        chai.expect(processExitStub).to.have.been.calledWith(1);
    });

    it("should print an error for a unhandled rejection", () => {
        // Given
        const consoleErrorStub = sandbox.stub(console, "error");
        const processExitStub = sandbox.stub(process, "exit");

        const error = new SyntaxError(
            "Invalid regular expression: /^(feat)(((?scope>.*)))?(?<breaking>!)?: (?<description>.*)/: Invalid group",
        );
        const promise = Promise.reject();

        // When
        onUnhandledRejection(error, promise);

        // Then
        chai.expect(consoleErrorStub).to.have.been.calledWith(
            "An unknown error occurred. Failed to generate Markdown report.",
        );
        chai.expect(processExitStub).to.have.been.calledWith(1);
    });
});
