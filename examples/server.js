const DomainEx = require("./../domainex"); // or require("domainex") if published

async function main() {
  const dx = new DomainEx({
    distPath: "./dist",
    templatePath: "./template.html",
    framework: "vanilla",
    cache: true,
  });

  await dx.createServer(3000, {
    "/": {
      component: "Home",
      props: () => ({ name: "Ezekiel" }),
    },
  });
}

main().catch(console.error);
