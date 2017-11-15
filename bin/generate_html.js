/*
 * Writes the HTML files based on the accounts and timespans on config.json
 */

var fs = require('fs');
var script_directory = process.argv[1].substring(0, process.argv[1].lastIndexOf("/"));
script_directory = script_directory.substring(0, script_directory.lastIndexOf("/") + 1);
var config = JSON.parse(fs.readFileSync(script_directory + 'config/config.json', 'utf8'));

var stats_template = fs.readFileSync(script_directory + 'templates/stats_template.html', 'utf8');
stats_template = stats_template.split("\n");
var workers_template = fs.readFileSync(script_directory + 'templates/workers_template.html', 'utf8');
workers_template = workers_template.split("\n");

var html_files = [];

config.accounts.forEach(account => {
  config.timespans.forEach(timespan => {
    var statslinks = [];
    var workerslinks = [];
    config.timespans.forEach(span => {
      statslinks.push('<a class="dropdown-item" href="stats_' + account.name + span.days + '.html">' + span.days + ' day</a>');
      workerslinks.push('<a class="dropdown-item" href="workers_' + account.name + span.days + '.html">' + span.days + ' day</a>');
    });
    statslinks = statslinks.join("\n            ");
    workerslinks = workerslinks.join("\n            ");
    html_files.push({
      'filename': 'stats_' + account.name + timespan.days + '.html',
      'accountname': account.name,
      'address': account.address,
      'timespan': timespan.days,
      'template': stats_template,
      'statslinks': statslinks,
      'workerslinks': workerslinks,
    });
    html_files.push({
      'filename': 'workers_' + account.name + timespan.days + '.html',
      'accountname': account.name,
      'address': account.address,
      'timespan': timespan.days,
      'template': workers_template,
      'statslinks': statslinks,
      'workerslinks': workerslinks,
    });
  });
  var workerlist_filename = 'data/workerlist_' + account.name + '.json';
  fs.writeFile(script_directory + workerlist_filename, JSON.stringify(account.workers, null, 2), 'utf8', (err) => {
    if (err) throw err;
    else console.log('✍️  ' + workerlist_filename + ' has been saved!');
  });
});

html_files.forEach(html_file => {
  var file_lines = [];
  html_file.template.forEach(line => {
    file_lines.push(
      line
      .replace(/%%ACCOUNTNAME%%/g, html_file.accountname)
      .replace(/%%ADDRESS%%/g, html_file.address)
      .replace(/%%TIMESPAN%%/g, html_file.timespan)
      .replace(/%%STATSLINKS%%/g, html_file.statslinks)
      .replace(/%%WORKERSLINKS%%/g, html_file.workerslinks)
    );
  });
  var file_content = file_lines.join("\n");
  fs.writeFile(script_directory + html_file.filename, file_content, 'utf8', (err) => {
    if (err) throw err;
    else console.log('✍️  ' + html_file.filename + ' has been saved!');
  });
});
