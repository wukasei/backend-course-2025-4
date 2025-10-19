const {Command} = require("commander");
const fs = require("fs");
const files = require("fs").promises;
const http = require ("http");
const url = require("url");
const { XMLBuilder } = require("fast-xml-parser"); 


const program = new Command;

program
  .requiredOption('-i, --input <path>', 'path to input JSON file')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port');

program.parse(process.argv);

const options = program.opts();

if(!fs.existsSync(options.input)){
    console.error('Cannot find input file');
    process.exit(1);
}

const xmlBuilderOptions = {
    arrayNodeName: "bank", 
    ignoreAttributes: true,
    format: true,
    textNodeName: "#text",
 
    declaration: {
        include: true,
        encoding: 'utf-8',
        version: '1.0'
    } 
}

const builder = new XMLBuilder(xmlBuilderOptions);

 async function ActionsRequest(req, res) {
    if(req.url === '/favicon.ico'){
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        const query = url.parse(req.url, true).query;
        const data = await files.readFile(options.input, "utf-8");
        let banks = JSON.parse(data);

        // Фільтрація нормальних банків
        if(query.normal === "true"){
            banks = banks.filter(bank => bank.COD_STATE === 1);
        }

        // Формування об'єктів для XML
        const transformedBanks = banks.map(bank => {
            const obj = {};
            if(query.mfo === "true") obj.mfo_code = bank.MFO; 
            obj.name = bank.SHORTNAME;                         
            obj.state_code = bank.COD_STATE;                   
            return obj;
        });


        const xmlObject = { banks: { bank: transformedBanks } };
        const xml = builder.build(xmlObject);


        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
        res.end(xml);
    } catch(err) {
        if (!res.headersSent) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
        }
        console.error('Помилка обробки запиту:', err.message);
    }
}


const server = http.createServer((req,res)=>{
    ActionsRequest(req, res); 
})

server.listen(Number(options.port), options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}/`);
});
