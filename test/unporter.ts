import * as chai from "chai";
import * as sinon from "sinon";

import { generateModelAsync, renderAsync } from "../src/unporter";
import { BranchSummary } from "simple-git";

import simpleGit from "simple-git";

import chaiAsPromised = require("chai-as-promised");
import chaiString = require("chai-string");
import markdownlint = require("markdownlint");

// tslint:disable: no-unused-expression
describe("unporter", () => {
    chai.use(chaiAsPromised);
    chai.use(chaiString);

    describe("generator", () => {
        it("should throw an exception if not Git repository", async () => {
            // Given
            const git = simpleGit();
            const gitBranchMock = sinon.stub(git, "checkIsRepo");

            gitBranchMock.withArgs().resolves(false);

            // When
            const promise = generateModelAsync("master", git);

            // Then
            await chai.expect(promise).to.be.rejectedWith(Error, "Is not a Git repository.");
        });

        it("should generate a document without commits", async () => {
            // Given
            const git = simpleGit();
            const gitBranchMock = sinon.stub(git, "branch");
            const gitLogMock = sinon.stub(git, "log");

            const branch = { current: "develop" } as BranchSummary;
            const allLogs = [];
            const logs = { all: allLogs } as any;

            gitBranchMock.withArgs().resolves(branch);
            gitLogMock.withArgs({ from: "master", to: "develop" }).resolves(logs);

            // When
            const document = await generateModelAsync("master", git);

            // Then
            chai.expect(document).is.an("object").and.have.keys("added", "changed", "fixed");

            chai.expect(document).has.property("added").and.is.empty;
            chai.expect(document).has.property("fixed").and.is.empty;
            chai.expect(document).has.property("changed").and.is.empty;
        });

        it("should generate a document with added commit", async () => {
            // Given
            const git = simpleGit();
            const gitBranchMock = sinon.stub(git, "branch");
            const gitLogMock = sinon.stub(git, "log");

            const branch = { current: "develop" } as BranchSummary;
            const logs: any = {
                all: [
                    {
                        body: "This commit adds a retry mechanism if the insertion in the database fails.",
                        hash: "8791d3a02e95a02f1a2b7fe410ba97d1b1e964d3",
                        message: "feat(ci): add retry mechanism for insertion in database",
                    },
                ],
            };

            gitBranchMock.withArgs().resolves(branch);
            gitLogMock.withArgs({ from: "master", to: "develop" }).resolves(logs);

            // When
            const document = await generateModelAsync("master", git);

            // Then
            const expectedAddedCommits = [
                {
                    description: "add retry mechanism for insertion in database",
                    hash: {
                        long: "8791d3a02e95a02f1a2b7fe410ba97d1b1e964d3",
                        short: "8791d3",
                    },
                    isBreakingChange: false,
                    message: "This commit adds a retry mechanism if the insertion in the database fails.",
                },
            ];

            chai.expect(document).has.property("added").and.is.deep.equal(expectedAddedCommits);
        });

        it("should generate a document with changed commit", async () => {
            // Given
            const git = simpleGit();
            const gitBranchMock = sinon.stub(git, "branch");
            const gitLogMock = sinon.stub(git, "log");

            const branch = { current: "develop" } as BranchSummary;
            const logs: any = {
                all: [
                    {
                        body: "This commit reviews the CI scripts.",
                        hash: "d1ae51c84d971982aed610f26b186b44b0d71b23",
                        message: "chore(ci): review scripts",
                    },
                ],
            };

            gitBranchMock.withArgs().resolves(branch);
            gitLogMock.withArgs({ from: "master", to: "develop" }).resolves(logs);

            // When
            const document = await generateModelAsync("master", git);

            // Then
            const expectedChangedCommits = [
                {
                    description: "review scripts",
                    hash: {
                        long: "d1ae51c84d971982aed610f26b186b44b0d71b23",
                        short: "d1ae51",
                    },
                    isBreakingChange: false,
                    message: "This commit reviews the CI scripts.",
                },
            ];

            chai.expect(document).has.property("changed").and.is.deep.equal(expectedChangedCommits);
        });

        it("should generate a document with added commit as a breaking change", async () => {
            // Given
            const git = simpleGit();
            const gitBranchMock = sinon.stub(git, "branch");
            const gitLogMock = sinon.stub(git, "log");

            const branch = { current: "develop" } as BranchSummary;
            const logs: any = {
                all: [
                    {
                        hash: "8e2a984f7456ab41f06441341e726fe8c20b0a02",
                        message: "feat(core)!: more precise type for APP_INITIALIZER token",
                    },
                ],
            };

            gitBranchMock.withArgs().resolves(branch);
            gitLogMock.withArgs({ from: "master", to: "develop" }).resolves(logs);

            // When
            const document = await generateModelAsync("master", git);

            // Then
            const expectedChangedCommits = [
                {
                    description: "more precise type for APP_INITIALIZER token",
                    hash: {
                        long: "8e2a984f7456ab41f06441341e726fe8c20b0a02",
                        short: "8e2a98",
                    },
                    isBreakingChange: true,
                    message: void 0,
                },
            ];

            chai.expect(document).has.property("added").and.is.deep.equal(expectedChangedCommits);
        });

        it("should generate a document with added commit as a breaking change without scope", async () => {
            // Given
            const git = simpleGit();
            const gitBranchMock = sinon.stub(git, "branch");
            const gitLogMock = sinon.stub(git, "log");

            const branch = { current: "develop" } as BranchSummary;
            const logs: any = {
                all: [
                    {
                        hash: "8e2a984f7456ab41f06441341e726fe8c20b0a02",
                        message: "feat!: more precise type for APP_INITIALIZER token",
                    },
                ],
            };

            gitBranchMock.withArgs().resolves(branch);
            gitLogMock.withArgs({ from: "master", to: "develop" }).resolves(logs);

            // When
            const document = await generateModelAsync("master", git);

            // Then
            const expectedChangedCommits = [
                {
                    description: "more precise type for APP_INITIALIZER token",
                    hash: {
                        long: "8e2a984f7456ab41f06441341e726fe8c20b0a02",
                        short: "8e2a98",
                    },
                    isBreakingChange: true,
                    message: void 0,
                },
            ];

            chai.expect(document).has.property("added").and.is.deep.equal(expectedChangedCommits);
        });
    });

    describe("render", () => {
        it("should return an empty output for no commits", async () => {
            // Given
            const model: any = {};

            // When
            const output = await renderAsync(model);

            // Then
            chai.expect(output).is.empty;
        });

        it("should return a markdown data for added commit", async () => {
            // Given
            const model: any = {
                added: [
                    {
                        description: "add retry mechanism for insertion in database",
                        hash: {
                            long: "8791d3a02e95a02f1a2b7fe410ba97d1b1e964d3",
                            short: "8791d3",
                        },
                        isBreakingChange: false,
                        message: "This commit adds a retry mechanism if the insertion in the database fails.",
                    },
                ],
            };

            // When
            const output = await renderAsync(model);

            // Then
            chai.expect(output).is.equalIgnoreSpaces(
                "## Added\r\n\r\n* (8791d3) add retry mechanism for insertion in database;\r\n\r\nThis commit adds a retry mechanism if the insertion in the database fails.\r\n\r\n\r\n",
            );
        });

        it("should return a markdown data for changed commit", async () => {
            // Given
            const model: any = {
                changed: [
                    {
                        description: "review scripts",
                        hash: {
                            long: "d1ae51c84d971982aed610f26b186b44b0d71b23",
                            short: "d1ae51",
                        },
                        isBreakingChange: false,
                        message: "This commit reviews the CI scripts.",
                    },
                ],
            };

            // When
            const output = await renderAsync(model);

            // Then
            chai.expect(output).is.equalIgnoreSpaces(
                "## Changed\r\n\r\n* (d1ae51) review scripts;\r\n\r\nThis commit reviews the CI scripts.\r\n\r\n\r\n",
            );
        });

        it("should return a markdown data for changed commit", async () => {
            // Given
            const config = { MD012: false, MD013: false, MD041: false };
            const model: any = {
                added: [
                    {
                        description: "add retry mechanism for insertion in database",
                        hash: {
                            long: "8791d3a02e95a02f1a2b7fe410ba97d1b1e964d3",
                            short: "8791d3",
                        },
                        isBreakingChange: false,
                        message: "This commit adds a retry mechanism if the insertion in the database fails.",
                    },
                ],
                changed: [
                    {
                        description: "review scripts",
                        hash: {
                            long: "d1ae51c84d971982aed610f26b186b44b0d71b23",
                            short: "d1ae51",
                        },
                        isBreakingChange: false,
                    },
                ],
                fixed: [
                    {
                        description: "increase the opacity of background-color for inline `code` blocks",
                        hash: {
                            long: "d1ae51c84d971982aed610f26b186b44b0d71b23",
                            short: "d1ae51",
                        },
                        isBreakingChange: false,
                        message:
                            "I intentionally did not change the font size as discussed in #41196 because the current font size is already about the same as the normal text size.\n\nFixes #41196\n\nPR Close #42297",
                    },
                ],
            };

            // When
            const output = await renderAsync(model);
            const strings = { output };
            const errors = markdownlint.sync({ strings, config });

            // Then
            chai.expect(errors).has.property("output").and.is.empty;
        });
    });
});
