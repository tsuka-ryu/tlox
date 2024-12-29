Deno.test("異常系: 引数が2個以上のケース", async () => {
  const command = new Deno.Command("deno", {
    args: ["run", "--allow-all", "main.ts", "command", "argument"],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout } = await command.output();

  console.assert("Usage: tlox [script]\n" === new TextDecoder().decode(stdout));
});
