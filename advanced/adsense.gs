/**
 * Copyright Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// [START apps_script_adsense_list_accounts]
/**
 * Lists available AdSense accounts.
 */
function listAccounts () {
  let pageToken;
  do {
    const response = AdSense.Accounts.list({ pageToken: pageToken });
    if (response.accounts) {
      for (const account of response.accounts) {
        Logger.log('Found account with resource name "%s" and display name "%s".',
          account.name, account.displayName);
      }
    } else {
      Logger.log('No accounts found.');
    }
    pageToken = response.nextPageToken;
  } while (pageToken);
}
// [END apps_script_adsense_list_accounts]

// [START apps_script_adsense_list_ad_clients]
/**
 * Logs available Ad clients for an account.
 *
 * @param {string} accountName The resource name of the account that owns the collection of ad clients.
 */
function listAdClients (accountName) {
  let pageToken;
  do {
    const response = AdSense.Accounts.Adclients.list(accountName, {
      pageToken: pageToken
    });
    if (response.adClients) {
      for (const adClient of response.adClients) {
        Logger.log('Found ad client for product "%s" with resource name "%s".',
          adClient.productCode, adClient.name);
        Logger.log('Reporting dimension ID: %s',
          adClient.reportingDimensionId ?? 'None');
      }
    } else {
      Logger.log('No ad clients found for this account.');
    }
    pageToken = response.nextPageToken;
  } while (pageToken);
}
// [END apps_script_adsense_list_ad_clients]

// [START apps_script_adsense_list_ad_units]
/**
 * Lists ad units.
 * @param {string} adClientName The resource name of the ad client that owns the collection of ad units.
 */
function listAdUnits (adClientName) {
  let pageToken;
  do {
    const response = AdSense.Accounts.Adclients.Adunits.list(adClientName, {
      pageSize: 50,
      pageToken: pageToken
    });
    if (response.adUnits) {
      for (const adUnit of response.adUnits) {
        Logger.log('Found ad unit with resource name "%s" and display name "%s".',
          adUnit.name, adUnit.displayName);
      }
    } else {
      Logger.log('No ad units found for this ad client.');
    }

    pageToken = response.nextPageToken;
  } while (pageToken);
}
// [END apps_script_adsense_list_ad_units]

// [START apps_script_adsense_generate_report]
/**
 * Generates a spreadsheet report for a specific ad client in an account.
 * @param {string} accountName The resource name of the account.
 * @param {string} adClientName The reporting dimension ID of the ad client.
 */
function generateReport (accountName, adClientReportingDimensionId) {
  // Prepare report.
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const report = AdSense.Accounts.Reports.generate(accountName, {
    // Specify the desired ad client using a filter.
    filters: ['AD_CLIENT_ID==' + escapeFilterParameter(adClientReportingDimensionId)],
    metrics: ['PAGE_VIEWS', 'AD_REQUESTS', 'AD_REQUESTS_COVERAGE', 'CLICKS',
      'AD_REQUESTS_CTR', 'COST_PER_CLICK', 'AD_REQUESTS_RPM',
      'ESTIMATED_EARNINGS'],
    dimensions: ['DATE'],
    ...dateToJson('startDate', oneWeekAgo),
    ...dateToJson('endDate', today),
    // Sort by ascending date.
    orderBy: ['+DATE']
  });

  if (report.rows) {
    const spreadsheet = SpreadsheetApp.create('AdSense Report');
    const sheet = spreadsheet.getActiveSheet();

    // Append the headers.
    sheet.appendRow(report.headers.map(header => header.name));

    // Append the results.
    sheet.getRange(2, 1, report.rows.length, report.headers.length)
      .setValues(report.rows.map(row => row.cells.map(cell => cell.value)));

    Logger.log('Report spreadsheet created: %s',
      spreadsheet.getUrl());
  } else {
    Logger.log('No rows returned.');
  }
}

/**
 * Escape special characters for a parameter being used in a filter.
 * @param {string} parameter The parameter to be escaped.
 * @return {string} The escaped parameter.
 */
function escapeFilterParameter (parameter) {
  return parameter.replace('\\', '\\\\').replace(',', '\\,');
}

/**
 * Returns the JSON representation of a Date object (as a google.type.Date).
 *
 * @param {string} paramName the name of the date parameter
 * @param {Date} value the date
 */
function dateToJson (paramName, value) {
  return {
    [paramName + '.year']: value.getFullYear(),
    [paramName + '.month']: value.getMonth() + 1,
    [paramName + '.day']: value.getDate()
  };
}

// [END apps_script_adsense_generate_report]
