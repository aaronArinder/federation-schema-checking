const { appendFile, readFileSync, promises } = require('fs');
const { promisify } = require('util');
const { parse } = require('graphql');
const { resolve } = require('path');
const promisifiedAppendFile = promisify(appendFile);

const readdirpromise = promises.readdir;

const GQL_STR_OFFSET = 'gql`'.length;
const PROJECT_BASE = '../';

module.exports = {
    operationCollector: {
        requestDidStart: ({ request }) => {
            const { query } = request;
            if (!/IntrospectionQuery/.test(query)) {
                const encodedQuery = Buffer.from(query).toString('base64');
                promisifiedAppendFile('./plugins/operations', encodedQuery + '\n');
            }
        }
    },
    schemaChecker
}

async function schemaChecker () {
    const schemaFiles = await getSchemaFiles();
    const operations = readFileSync('./plugins/operations', 'utf8')
        .split('\n')
        .filter(op => op !== '')

    const uniqueOperations = new Set(operations);

    for (const operation of uniqueOperations) {
        const decodedOperation = Buffer.from(operation, 'base64').toString('utf8');

        let operationName;
        const valid = schemaFiles.some(file => {
            const definitions = parseAST(file);
            const parsedDecodedOperation = parse(decodedOperation);

            return parsedDecodedOperation
            .definitions[0]
            .selectionSet
            .selections
                .every(
                    sel => {
                        return sel.selectionSet.selections.every(
                            subSelSelection => {
                                const name = subSelSelection.name.value
                                operationName = name;
                                const def = findDefinition(definitions, name)
                                return def;
                            }
                        )
                    }
            )
        })

        if (!valid) {
            throw new Error(`breaking schema change: field ${operationName} actively used, but has been removed.`);
        }
    }
    console.log('all is well with the world')
}

schemaChecker();

/**
 * Heavy handed parsing when we could just import typeDefs, but this removes the need
 * for exporting typeDefs
 */
function parseAST (file) {
    const content = readFileSync(file, 'utf-8');
    const gqlIdx = content.indexOf('gql`') + GQL_STR_OFFSET;
    const finalBacktickIdx = content.indexOf('`', gqlIdx);
    const schema = content.substring(gqlIdx, finalBacktickIdx);
    const AST = parse(schema);

    return AST.definitions;
}


function findDefinition (defs, name) {
    return defs.find(d => {
        if (d.name.value === name) {
            return d;
        } else if (d.fields) {
            return d.fields.find(f => f.name.value === name);
        }
    })
}

async function getSchemaFiles () {
    const fileNames = [];

    for await (const fileName of getFiles(PROJECT_BASE)) {
        fileNames.push(fileName);
    }

    return fileNames;
}

async function* getFiles(dir) {
    const dirents = await readdirpromise(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            if (
                /graphql.js/.test(res)
                && !/node_modules/.test(res)
            ) {
                yield res;
            }
        }
    }
}

