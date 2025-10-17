const {Command} = require("commander");
const files = require("fs");
const http = require ("http");

const program = new Command;

program
  .requiredOption('-i, --input <path>', 'path to input JSON file')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port');

program.parse(process.argv);

const options = program.opts();

if(!files.existsSync(options.input)){
    console.log('Cannot find input file');
    process.exit(1);
}

const server = http.createServer((req,res)=>{
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Server is running!\n')
})

server.listen(Number(options.port), options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
