import * as fs from "fs";
import * as path from "path";
import * as mustache from "mustache";

import { DefaultLogFields, SimpleGit } from "simple-git";

import simpleGit from "simple-git";

interface Commit {
    description: string;
    hash: Hash;
    isBreakingChange: boolean;
    message?: string;
}

interface Hash {
    long: string;
    short: string;
}

interface Model {
    added: Commit[];
    changed: Commit[];
    fixed: Commit[];
}

function readFileAsync(file: string) {
    return new Promise<Buffer>((resolve, reject) =>
        fs.readFile(file, (error, data) => (error ? reject(error) : resolve(data))),
    );
}

async function readFileToUtf8StringAsync(file: string) {
    const buffer = await readFileAsync(file);
    return buffer.toString("utf8");
}

function createCommit(regExp: RegExp, log: DefaultLogFields, apply: (commit: Commit) => void) {
    const match = regExp.exec(log.message);
    if (match && match.groups) {
        const longHash = log.hash;
        const shortHash = longHash.substr(0, 6);

        const hash = { long: longHash, short: shortHash };
        const isBreakingChange = !!match.groups.breaking;
        const commit = { hash, description: match.groups.description, isBreakingChange, message: log.body };

        apply(commit);
    }
}

async function assertGitRepository(git: SimpleGit) {
    const isGitRepository = await git.checkIsRepo();
    if (!isGitRepository) {
        throw new Error("Is not a Git repository.");
    }
}

export async function generateModelAsync(parentBranchName: string, git = simpleGit()) {
    await assertGitRepository(git);

    const addedCommitRegExp = /(feat)(\((?<scope>.*)\))?(?<breaking>!)?: (?<description>.*)/;
    const changedCommitRegExp =
        /(build|chore|docs|perf|refactor|style)(\((?<scope>.*)\))?(?<breaking>!)?: (?<description>.*)/;
    const fixedCommitRegExp = /(fix)(\((?<scope>.*)\))?(?<breaking>!)?: (?<description>.*)/;

    const commitsInformation = { added: [], changed: [], fixed: [] } as Model;

    const branch = await git.branch();
    const logs = await git.log({ from: parentBranchName, to: branch.current });
    for (const log of logs.all) {
        createCommit(addedCommitRegExp, log, (commit) => commitsInformation.added.push(commit));
        createCommit(changedCommitRegExp, log, (commit) => commitsInformation.changed.push(commit));
        createCommit(fixedCommitRegExp, log, (commit) => commitsInformation.fixed.push(commit));
    }

    return commitsInformation;
}

export async function renderAsync(model: Model) {
    const file = path.resolve(__dirname, "..", "template.mustache");
    const template = await readFileToUtf8StringAsync(file);

    return mustache.render(template, model);
}
