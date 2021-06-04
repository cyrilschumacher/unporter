import * as chai from "chai";
import * as sinon from "sinon";

import { parseOptions } from "../src";

import debug from "debug";

import sinonChai = require("sinon-chai");

describe("cli", () => {
    chai.use(sinonChai);

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => (sandbox = sinon.createSandbox()));
    afterEach(() => sandbox.restore());

    it("should disable debug mode, by default", () => {
        // Given
        const argv = ["node.js", "index.js"];

        // When
        const options = parseOptions(argv);

        // Then
        chai.expect(options).to.be.an("object").and.include.keys("debug");
        chai.expect(options).have.property("debug", false);
    });

    it("should enable debug mode", () => {
        // Given
        const debugEnableStub = sandbox.stub(debug, "enable");
        const argv = ["node.js", "index.js", "--debug"];

        // When
        const options = parseOptions(argv);

        // Then
        debugEnableStub.restore();

        chai.expect(debugEnableStub).to.have.been.calledWith("unporter,unporter:*,simple-git,simple-git:*");
        chai.expect(options).to.be.an("object").and.include.keys("debug");
        chai.expect(options).have.property("debug", true);
    });

    it("should specify an output file", () => {
        // Given
        const argv = ["node.js", "index.js", "--out", "changelog.md"];

        // When
        const options = parseOptions(argv);

        // Then
        chai.expect(options).to.be.an("object").and.include.keys("out");
        chai.expect(options).have.property("out", "changelog.md");
    });

    it("should enable debug mode and specify an output file", () => {
        // Given
        const debugEnableStub = sandbox.stub(debug, "enable");
        const argv = ["node.js", "index.js", "--out", "changelog.md", "--debug"];

        // When
        const options = parseOptions(argv);

        // Then
        debugEnableStub.restore();

        chai.expect(debugEnableStub).to.have.been.calledWith("unporter,unporter:*,simple-git,simple-git:*");
        chai.expect(options).to.be.an("object").and.include.keys("debug", "out");
        chai.expect(options).have.property("out", "changelog.md");
        chai.expect(options).have.property("debug", true);
    });

    it("should print help", () => {
        // Given
        const argv = ["node.js", "index.js", "--help"];

        const processStdoutWriteStub = sandbox.stub(process.stdout, "write");
        const processExitStub = sandbox.stub(process, "exit");

        // When
        const options = parseOptions(argv);

        // Then
        processExitStub.restore();
        processStdoutWriteStub.restore();

        chai.expect(options).to.be.an("object").and.include.keys("debug");
        chai.expect(options).have.property("debug", false);

        chai.expect(processStdoutWriteStub).to.have.been.calledWithMatch("Usage: index [options]");
    });
});
