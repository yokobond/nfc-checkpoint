# NFC Checkpoint

This is a checkpoint service using NFC tags and Google Apps Script. The service is built on top of Google Apps Script and uses the NFC tag reader to read the NFC tag ID. The ID is then sent to the Google Apps Script project, which records the ID in a Google Sheet. The Google Sheet is then used to manage entries and exits of the users.

## Prerequisites

- Node.js and npm installed on your machine
- [clasp](https://github.com/google/clasp) installed globally (`npm install -g @google/clasp`)
- Google Apps Script project created and the script ID is known

## Setup

1. Clone this repository: `git clone <repository-url>`
2. Navigate into the project directory: `cd <repository-name>`
3. Install the dependencies: `npm install`
4. Login to clasp: `clasp login`
5. Create clasp project with *sheets*: `clasp create --type sheets`
6. Modify property of the `.clasp.json` to ` "rootDir":"./gas"`
7. Push the local code to the Apps Script project with manifest overwriting: `clasp:push`
8. Open the Apps Script project in the browser: `clasp open`
9. Replace REPLACE_SPREAD_SHEET_ID in code.gs with the spreadsheet ID of the "Nfc-checkpoint" spreadsheet.
10. Deploy the project as a web app and get the deployment ID
11. Open the `public/index.html` file and input the deployment ID in the field `API Key`
12. Open the list of records page or card reader page

## Development

### Google Apps Script

- To push the local code to the Apps Script project, run: `npm run clasp:push`
- To pull the online code to the local project, run: `npm run clasp:pull`
- Get the `deployment ID` from the Apps Script project for the web app

### Local Server

- To start the liveServer from Visual Studio Code
- Access the project at: `http://<local server>/public/?id=<deployment ID>`

## Deployment

### GitHub Pages

- Set the GitHub Pages source to the `root` folder
- Access the project at: `https://<username>.github.io/<repository-name>/public/?id=<deployment ID>`


Please replace `<repository-url>`, `<repository-name>`, and `<script-id>` with your actual repository URL, project directory, and script ID, respectively.

## References

The code to read the NFC tag refers to 'con3code/pasorich: Scratch 3.0 extension. Read SmartCard's IDm with PaSoRi. 'https://github.com/con3code/pasorich

## Author

- Koji Yokokawa (koji.yokokawa@gmail.com)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
