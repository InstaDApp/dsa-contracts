import inquirer from "inquirer";
import { promises as fs } from "fs";
import { join } from "path/posix";
import { spawn } from "child_process";

export async function execScript(cmd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const parts = cmd.split(" ");
    const proc = spawn(parts[0], parts.slice(1), {
      shell: true,
      stdio: "inherit",
    });
    proc.on("exit", (code) => {
      if (code !== 0) {
        reject(code);
        return;
      }

      resolve(code);
    });
  });
}

async function testRunner() {
  const testsPath = join(__dirname, "../test");
  await fs.access(testsPath);
  const availableTests = await fs.readdir(testsPath);
  if (availableTests.length === 0) {
    throw new Error(`No tests available!`);
  }

  const { testName } = await inquirer.prompt([
    {
      name: "testName",
      message: "Which tests do you want to run?",
      type: "list",
      choices: ["all", ...availableTests],
    },
  ]);

  let paths: string[] = [];
  if (testName === "all") {
    paths = availableTests.map((file) => join(testsPath, file));
  } else {
    paths = [join(testsPath, testName)];
  }

  for (const path of paths) {
    await execScript("npx hardhat test " + path);
  }
}

testRunner()
  .then(() => console.log("🙌 finished the test runner"))
  .catch((err) => console.error("❌ failed due to error: ", err));
