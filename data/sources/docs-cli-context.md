> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Context CLI command reference

Reference documentation for the Sanity CLI context command.

**npm**

```shell
npx sanity context --help
```

**pnpm**

```shell
pnpm dlx sanity context --help
```

**yarn**

```shell
yarn dlx sanity context --help
```

**bun**

```shell
bunx sanity context --help
```

## Commands

### `build`

**CLI output**

```sh
USAGE
  $ sanity context build KNOWLEDGEBASEID [--cancel] [--watch]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

FLAGS
      --cancel  Cancel the running build instead of starting one
      --watch   Wait for the build to finish, exiting non-zero if it fails

DESCRIPTION
  Build a knowledge base from its imported content

EXAMPLES
  Start a build and return the job ID

    $ sanity context build kb-abc123

  Start a build and wait for it to finish (non-zero exit on failure)

    $ sanity context build kb-abc123 --watch

  Cancel the running build, if any

    $ sanity context build kb-abc123 --cancel
```

### `create`

**CLI output**

```sh
USAGE
  $ sanity context create [--description <value>] [--organization <id>] [--title <value>]

FLAGS
      --description=<value>  Knowledge base description
      --title=<value>        Knowledge base title

OVERRIDE FLAGS
      --organization=<id>  Organization to create the knowledge base in (overrides CLI configuration)

DESCRIPTION
  Create a knowledge base

EXAMPLES
  Interactively create a knowledge base

    $ sanity context create

  Create a knowledge base in a specific organization

    $ sanity context create --organization org-abc123 --title "Support docs" --description "Product docs and troubleshooting guides"
```

### `delete`

**CLI output**

```sh
USAGE
  $ sanity context delete KNOWLEDGEBASEID [--yes]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

FLAGS
  -y, --yes  Skip confirmation prompt (unattended mode)

DESCRIPTION
  Delete a knowledge base and its generated content

EXAMPLES
  Delete a knowledge base after confirmation

    $ sanity context delete kb-abc123

  Delete a knowledge base without confirmation prompt

    $ sanity context delete kb-abc123 --yes
```

### `get`

**CLI output**

```sh
USAGE
  $ sanity context get KNOWLEDGEBASEID [--json]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

FLAGS
      --json  Output the knowledge base in JSON format

DESCRIPTION
  Get details of a knowledge base

EXAMPLES
  Get details of a specific knowledge base

    $ sanity context get kb-abc123

  Output the knowledge base as JSON

    $ sanity context get kb-abc123 --json
```

### `imports`

#### `create`

**CLI output**

```sh
USAGE
  $ sanity context imports create KNOWLEDGEBASEID [--content-type <mime>] [--file <path>] [--query <value>] [--sanity-dataset <name>] [--sanity-project <id>] [--text <value>] [--title <value>] [--url <url>]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

FLAGS
      --content-type=<mime>    Content type of the import (--text: text/markdown or text/plain; --file: any MIME type, inferred from the file extension when omitted)
      --file=<path>            Path to a local file to import
      --query=<value>          GROQ query binding a Sanity dataset as a source
      --sanity-dataset=<name>  Sanity dataset for a dataset import
      --sanity-project=<id>    Sanity project ID for a dataset import
      --text=<value>           Inline text content to import (requires --title)
      --title=<value>          Title for an inline text import
      --url=<url>              Website URL to crawl

DESCRIPTION
  Import content into a knowledge base

EXAMPLES
  Import inline text

    $ sanity context imports create kb-abc123 --text "Refunds are processed within 5 days" --title "Refund policy"

  Upload and import a local file

    $ sanity context imports create kb-abc123 --file ./handbook.pdf

  Crawl a website

    $ sanity context imports create kb-abc123 --url https://example.com/docs

  Bind a Sanity dataset as a source

    $ sanity context imports create kb-abc123 --query '*[_type == "article"]' --sanity-project abc123 --sanity-dataset production
```

#### `delete`

**CLI output**

```sh
USAGE
  $ sanity context imports delete KNOWLEDGEBASEID IMPORTID [--yes]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID
  IMPORTID         Import ID

FLAGS
  -y, --yes  Skip confirmation prompt (unattended mode)

DESCRIPTION
  Delete an import from a knowledge base

EXAMPLES
  Delete an import after confirmation

    $ sanity context imports delete kb-abc123 import-def456

  Delete an import without confirmation prompt

    $ sanity context imports delete kb-abc123 import-def456 --yes
```

#### `download`

**CLI output**

```sh
USAGE
  $ sanity context imports download KNOWLEDGEBASEID IMPORTID [--json]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID
  IMPORTID         Import ID

FLAGS
      --json  Output the download URL in JSON format

DESCRIPTION
  Get a short-lived signed URL for the original uploaded bytes of a file import

EXAMPLES
  Get a download URL for an uploaded file

    $ sanity context imports download kb-abc123 import-def456
```

#### `get`

**CLI output**

```sh
USAGE
  $ sanity context imports get KNOWLEDGEBASEID IMPORTID [--json]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID
  IMPORTID         Import ID

FLAGS
      --json  Output the import in JSON format

DESCRIPTION
  Get details of an import

EXAMPLES
  Get details of a specific import

    $ sanity context imports get kb-abc123 import-def456

  Output the import as JSON

    $ sanity context imports get kb-abc123 import-def456 --json
```

#### `list`

**CLI output**

```sh
USAGE
  $ sanity context imports list KNOWLEDGEBASEID [--json]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

FLAGS
      --json  Output imports in JSON format

DESCRIPTION
  List imports for a knowledge base

EXAMPLES
  List all imports for a knowledge base

    $ sanity context imports list kb-abc123

  Output imports as JSON

    $ sanity context imports list kb-abc123 --json
```

### `jobs`

#### `get`

**CLI output**

```sh
USAGE
  $ sanity context jobs get KNOWLEDGEBASEID JOBID [--json] [--watch]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID
  JOBID            Job ID

FLAGS
      --json   Output the job in JSON format
      --watch  Poll until the job reaches a terminal state

DESCRIPTION
  Get the status of a knowledge base job

EXAMPLES
  Get the current status of a job

    $ sanity context jobs get kb-abc123 job-def456

  Wait for the job to finish (non-zero exit if it does not succeed)

    $ sanity context jobs get kb-abc123 job-def456 --watch
```

### `list`

**CLI output**

```sh
USAGE
  $ sanity context list [--json] [--organization <id>]

FLAGS
      --json  Output knowledge bases in JSON format

OVERRIDE FLAGS
      --organization=<id>  Organization to list knowledge bases for (overrides CLI configuration)

DESCRIPTION
  List knowledge bases in an organization

EXAMPLES
  List knowledge bases, selecting the organization interactively

    $ sanity context list

  List knowledge bases in a specific organization

    $ sanity context list --organization org-abc123

  Output knowledge bases as JSON

    $ sanity context list --organization org-abc123 --json
```

### `refresh`

**CLI output**

```sh
USAGE
  $ sanity context refresh KNOWLEDGEBASEID

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

DESCRIPTION
  Refresh a knowledge base: re-check sources and apply what changed

EXAMPLES
  Start an incremental refresh

    $ sanity context refresh kb-abc123
```

### `update`

**CLI output**

```sh
USAGE
  $ sanity context update KNOWLEDGEBASEID [--description <value>] [--refresh-enabled] [--refresh-frequency <value>] [--title <value>]

ARGUMENTS
  KNOWLEDGEBASEID  Knowledge base ID

FLAGS
      --description=<value>        New knowledge base description
      --refresh-enabled            Enable scheduled refresh (--no-refresh-enabled to disable)
      --refresh-frequency=<value>  How often scheduled refresh runs
      --title=<value>              New knowledge base title

DESCRIPTION
  Update a knowledge base

EXAMPLES
  Rename a knowledge base

    $ sanity context update kb-abc123 --title "New title"

  Enable weekly scheduled refresh

    $ sanity context update kb-abc123 --refresh-enabled --refresh-frequency weekly

  Disable scheduled refresh

    $ sanity context update kb-abc123 --no-refresh-enabled
```

