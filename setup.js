/*
 * Writes the HTML files based on the accounts and timespans on settings.json
 */

var fs = require('fs');
var script_directory = process.argv[1].substring(0, process.argv[1].lastIndexOf("/") + 1) + '/';
var config = JSON.parse(fs.readFileSync(script_directory + '/settings.json', 'utf8'));
var html_files = [];
var html_template = null;

config.accounts.forEach(account => {
  config.timespans.forEach(timespan => {
    html_files.push({
      'filename': 'stats_' + account.name + timespan.days + '.html',
      'accountname': account.name,
      'address': account.address,
      'timespan': timespan.days,
    });
  });
});

html_files.forEach(html_file => {
  if(html_template === null){
    html_template = fs.readFileSync(script_directory + '/template.html', 'utf8');
    html_template = html_template.split("\n");
  }
  var file_lines = [];
  html_template.forEach(line => {
    file_lines.push(
      line
      .replace("%%ACCOUNTNAME%%", html_file.accountname)
      .replace("%%ADDRESS%%", html_file.address)
      .replace("%%TIMESPAN%%", html_file.timespan)
    );
  });
  var file_content = file_lines.join("\n");
  fs.writeFile(script_directory + html_file.filename, file_content, 'utf8', (err) => {
    if (err) throw err;
    else console.log('✍️  ' + html_file.filename + ' has been saved!');
  });
});
