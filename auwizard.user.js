// ==UserScript==
// @name        Ask Ubuntu WIZARD 
// @namespace   http://userscripts.org/users/217436
// @include     http://askubuntu.com/questions/ask
// @version     0.1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// ==/UserScript==

var $ = unsafeWindow.jQuery;

/*jshint multistr: true */
$("head").append("\
<style type=\"text/css\">\
	#wizardContainer {display:none;padding:30px 40px 0;font-size:150%;text-align:center}\
	#wizardContainer h1 {font-size:190%;margin-bottom:15px;line-height:1.1em}\
	#wizardContainer #step_description {line-height:1.3em}\
	#wizardContainer .helplink {font-size:80%}\
	#wizardContainer .clear {clear:both}\
	#wizardContainer a.bottomlink {padding:20px 0;font-size:120%;display:block;text-align:left;float:left;text-align:left}\
	#wizardContainer a#revert {float:right;text-align:right}\
	#wizardContainer .choicelist {list-style:none;margin:0;padding:0}\
	#wizardContainer .choicelist li {float:left;width:430px;padding:10px 0;margin:0}\
	#wizardContainer .choicelist li:nth-child(odd) {margin:0 20px 0 0;clear:left}\
	#wizardContainer a.choice {display:block;width:390px;font-size:170%;color:#000;padding:25px 20px;font-weight:normal;text-align:center;border-radius:10px;box-shadow:0px 1px 3px rgba(000,000,000,0.5), inset 0px -1px 0px rgba(255,255,255,0.7);background:#eee;line-height:1em}\
	#wizardContainer a.choice > span {display:block;font-size:43%;font-weight:normal;line-height:1.4em;padding:10px 30px 0}\
	#wizardContainer a.choice:hover {text-decoration:none;background:#fff}\
	#wizardContainer .pastebox {width:100%;background:#eee;font-size:100%;margin-bottom:20px;height:95px}\
	#wizardContainer .search-results {margin:15px 81px;text-align:left;float:left;font-size:67%}\
	#wizardContainer .search-result:nth-child(n+6) {display:none}\
	#wizardContainer h3 {text-align:left;font-size:140%}\
	#wizardContainer h3 code {background:0}\
	#wizardContainer pre {text-align:left}\
	#wizardContainer #loadingMsg {font-size:400%;margin:20px;text-align:center}\
	.wizardExit {background:#eee;padding:15px}\
	.questionframe {font-size:67%;max-height:500px;overflow:auto;overflow-x:hidden;text-align:left;margin:0 -50px 15px}\
</style>");

var wizard_data = {
	"title": "&ldquo;Technical support speaking.<br/>Have you tried turning it off and on again?&rdquo;",
	"description": "This wizard will try to identify the most common problems and if it fails, it will help you to build a high quality question that people can (hopefully) answer. Start by locating your problem below...",
	"handler": "choice",
	"choices": [
		{
			"choice": "Problems Booting",
			"choice_description": "Including unprompted restarts, halts and unpassable error messages.",
			"title": "How far through the boot do you get?",
			"handler": "choice",
			"choices": [
				{
					"choice": "Missing OS or Grub error",
					"handler": "qa",
					"qa": "88384",
					"fail": { "handler": "ask" },
					"tags": ["grub",],
				},
				{
					"choice": "Ubuntu hangs on the loading screen",
					"handler": "qa",
					"qa": "162075",
					"fail": { "handler": "ask" },
				},
				{
					"choice": "Ubuntu tries to load the desktop but dumps me in a terminal",
					"title": "This could be driver related...",
					"description": "When we've seen things like this before, often the user hasn't installed the correct driver...<br>Are you sure that you've got the correct driver installed?",
					"handler": "choice",
					"choices": [
						{
							"choice": "How do I install the correct graphics drivers?",
							"handler": "link",
							"link": "choices[3]", // links to graphics
						},
						{
							"choice": "No, I've definitely got the right driver",
							"handler": "ask",
						},
					],
				},
				{
					"choice": "I see the desktop but can't do anything",
				},
			],
		},
		{
			"choice": "Post-boot System Crashes",
			"choice_description": "Including Kernel panics, frozen screens and frozen mice.<br>This is not for single application crashes.<br>This is currently just a test of the QA handler",
			"handler": "qa",
			"qa": "36930",
			"fail": { "handler": "ask" },
		},
		{
			"choice": "Networking Problems",
			"choice_description": "Including wireless driver installation, no available networks, disconnects and slow Internet.",
			"title": "What sort of networking problem?",
			"handler": "choice",
			"choices": [
				{
					"choice": "I can't connect to my wireless router",
					"title": "What networking device are you using?",
					"description": "Please open a terminal and run ${CODE}. Copy the full output into the following input input and click Submit",
					"handler": "hardware_picker",
					"code": "lspci -nnk | grep -i net -A2",
					"fail": { "handler": "ask" },
				},
				{
					"choice": "I <em>can</em> connect but cannot view websites",
					"title": "We need some diagnostic information to be able to answer your question",
					"description": "Please run all of the following commands in a terminal window and copy and paste their output into the boxes provided below. When you click submit a question will be built for you including this data to help people help you.",
					"handler": "commands",
					"commands": [
						"ifconfig",
						"ping -c4 8.8.8.8",
						"ping -c4 google.com",
						"route -n",
						"nm-tool",
					],
					"outcome": { "handler": "ask" },
				},
			],
		},
		{
			"choice": "Graphics Drivers",
			"choice_description": "This section will help you identify your graphics card(s) and install the correct drivers.",
			"title": "Let's start by identifing your graphics setup!",
			"description": "Please open a terminal and type ${CODE} and copy it into the following box.",
			"code": "lspci -nnk | grep -i VGA -A1",
			"handler": "graphics_picker",
			"outcomes": {
				"optimus": {
					"title": "This is a Nvidia Optimus system!",
					"handler": "qa",
					"qa": "36930",
					"fail": { "handler": "ask" },
					"tags": ["nvidia", "nvidia-optimus"],
				},
				"amdhybrid": {
					"title": "This is an AMD Crossfire Hybrid system!",
					"handler": "qa",
					"qa": "205112",
					"fail": { "handler": "ask" },
					"tags": ["amd", "amd-hybrid-crossfire"],
				},
				"nvidia": {
					"title": "This is a Nvidia system!",
					"fail": { "handler": "ask" },
					"tags": ["nvidia", ],
				},
				"amd": {
					"title": "This is an AMD/ATI system!",
					"fail": { "handler": "ask" },
					"tags": ["ati", ],
				},
				"intel": {
					"title": "This is an Intel system!",
					"fail": { "handler": "ask" },
					"tags": ["intel-graphics",],
				},
			},
		},
	],
};

var handlers = {
	'choice': function() {
		// Basic choices to change step.
		// Includes display logic :(
		step = unsafeWindow.step;

		ul = $('<ul class="choicelist">')
			.appendTo(wiz);

		linkClick = function(e) {
			e.preventDefault();
			stepChange(step.choices[$(this).attr('rel')]);
		};

		sorter = function(a, b) {
			ha = $(a).height();
			hb= $(b).height();
			return (ha > hb) ? -1 : (ha < hb) ? 1 : 0;
		};

		for (var i=0; i<step.choices.length; i++) {
			li = $('<li rel="' + i + '"></li>')
				.on('click', linkClick)
				.appendTo(ul);

			a = $('<a class="choice" href="#">' + typogrify(step.choices[i].choice)  + '</a>')
				.appendTo(li);

			if (step.choices[i].choice_description)
				$("<span>" + typogrify(step.choices[i].choice_description) + "</span>")
					.appendTo(a);

			if (i%2!==0) {
				// make choices in row equal height with extra padding
				ab = $(ul).children().slice(-2, i+1).sort(sorter);
				added = $(ab[0]).height() - $(ab[1]).height();
				$(ab[1]).find('a').css('padding', (25+parseInt(added/2, 10)) + 'px 20px');
			}
		}
	},

	'hardware_picker': function() {
		// Grabs the ID for one bit of hardware (giving the user a choice if
		// ... they have more than one in the output and then searching on 
		// ... that ID. If the search doesn't turn up anything, we push them
		// ... off to the provided fail method.

		copyhelp();

		step = unsafeWindow.step;
		ta = $('<textarea class="pastebox" id="hardware_picker"></textarea>')
			.appendTo(wiz);
		submit = $('<button class="popup-submit button">Submit</button>')
			.appendTo(wiz)
			.on('click', function(e) {
				if (!$(ta).val()) return alert("Please follow the instructions above.");
				matches = $(ta).val().match(/\[\d{4}\]\: (.*) \[([0-9a-f\:]{9})\]/g);
				
				$("#step_description").hide();
				$(ta).hide();
				$(submit).hide();
				$(wiz).append('<p id="step_description">Please select the device that seems most relevant:</p>');

				wiz.post += "\n\n###`"+ step.code + "`\n\n" + codify($(ta).val());

				searchFail = function() {
					stepChange(step.fail);
				};

				searchFunction = function() {
					searchResults(id, searchFail);
				};

				linkClick = function(e) {
					e.preventDefault();
					q = $(this).attr('rel');
					setTimeout(function() {
						searchResults(q, searchFail);
					}, 0);
				};
				
				ul = $('<ul>');
				for (var i=0; i<matches.length; i++) {
					desc = matches[i].substring(8, matches[i].length - 12);
					id = matches[i].substring(matches[i].length - 10, matches[i].length-1);
					
					if (matches.length==1)
						return setTimeout(searchFunction, 0);
					
					link = $('<li class="choice" rel="'+ id +'"><a href="#"><code>' + desc + '</code></a></li>');
					$(link).on('click', linkClick);
					$(ul).append(link);
				}
				$(wiz).append(ul);
			});
		$(wiz).append("<h2 style=\"clear:both\">Here's some debug data...</h2><pre><code>09:00.0 Ethernet controller [0200]: Realtek Semiconductor Co., Ltd. RTL8111/8168 PCI Express Gigabit Ethernet controller [10ec:8168] (rev 03)\n	Subsystem: Gigabyte Technology Co., Ltd Motherboard [1458:e000]\n	Kernel driver in use: r8169\n0a:00.0 Ethernet controller [0200]: Realtek Semiconductor Co., Ltd. RTL8111/8168 PCI Express Gigabit Ethernet controller [10ec:8168] (rev 03)\n	Subsystem: Gigabyte Technology Co., Ltd Motherboard [1458:e000]\n	Kernel driver in use: r8169</code></pre>");
	},

	'commands':  function() {
		// Ask for commands' output, add them to the post builder and move on

		copyhelp();

		step = unsafeWindow.step;
		for (var i=0; i<step.commands.length; i++) {
			$(wiz).append($('<h3><code>' + step.commands[i] + '</code></h3>'));
			$(wiz).append($('<textarea class="pastebox" id="command' + i + '"></textarea>'));
		}
		
		$('<button class="popup-submit button">Submit</button>')
			.appendTo(wiz)
			.on('click', function() {
				for (var i=0; i<step.commands.length; i++) {
					output = $('#command'+i).val();
					if (!output)
						continue;
					wiz.post += '\n\n###`' + step.commands[i] + '`\n\n' + codify(output);
				}
				stepChange(step.outcome);
			});
	},

	'graphics_picker': function() {
		// grab the users's graphics data and work out what they need
		// ... before handing them back to the appropriate handler

		copyhelp();

		step = unsafeWindow.step;
		ta = $('<textarea class="pastebox" id="hardware_picker"></textarea>')
			.appendTo(wiz);
		submit = $('<button class="popup-submit button">Identify</button>')
			.appendTo(wiz)
			.on('click', function() {
				input = $(ta).val();
				if (!input)
					return alert("This is required.");

				var intel = !!input.match(/ intel /i);
				var nvidia = !!input.match( /nvidia /i);
				var amd = !!input.match(/ (amd|ati) /i);

				var outcome = "";

				if (intel && nvidia)
					outcome = "optimus";
				else if (intel && amd )
					outcome = "amdhybrid";
				else if (intel)
					outcome = "intel";
				else if (amd)
					outcome = "amd";
				else if (nvidia)
					outcome = "nvidia";

				stepChange(step.outcomes[outcome]);
			});

		$("<div class=\"clear\"><h3>Testing Data</h3></div><pre><code>\
ATI pure:\n\
01:00.0 VGA compatible controller [0300]: Advanced Micro Devices [AMD] nee ATI Redwood XT [Radeon HD 5670] [1002:68d8]\n\
	Subsystem: PC Partner Limited Device [174b:e151]\n\n\n\
Another ATI pure:\n\
02:00.0 VGA compatible controller [0300]: Advanced Micro Devices [AMD] nee ATI Turks XT [Radeon HD 6670] [1002:6758]\n\
	Subsystem: XFX Pine Group Inc. Device [1682:3181]\n\n\n\
Nvidia pure:\n\
03:00.0 VGA compatible controller [0300]: NVIDIA Corporation GF110 [GeForce GTX 580] [10de:1080] (rev a1)\n\
	Kernel driver in use: nvidia\n\n\n\
AMD Crossfire Hybrid\n\n\
01:05.0 VGA compatible controller [0300]: Advanced Micro Devices [AMD] nee ATI RS880M [Mobility Radeon HD 4225/4250] [1002:9712]\n\
Subsystem: Hewlett-Packard Company Device [103c:143c]\n\
02:00.0 VGA compatible controller [0300]: Advanced Micro Devices [AMD] nee ATI Park [Mobility Radeon HD 5430/5450/5470] [1002:68e0]\n\
Subsystem: Hewlett-Packard Company Device [103c:143c]\n\n\n\
</code></pre>").appendTo(wiz);
	},

	'qa': function() {
		// Present the user with what we think is the best existing question 
		// ... for their problem. They can disagree and go onto ask a new one.
		step = unsafeWindow.step;

		$(wiz).empty().append(
			'<h1>' + typogrify("We thought the following question might be exactly what you\'re looking for!") + '</h1>',
			'<p id="step_description">' + typogrify("Please take a careful look at the question and its available answers.<br>If it dosen't help, click the button under the post.") + '</p>'
		);

		url = "http://askubuntu.com/questions/"+ step.qa +"/ #content";
		$('<div class="questionframe"><div id="loadingMsg">Loading question...</div></div>')
			.appendTo(wiz)
			.load(url);

		$('<button class="popup-submit button">No, this doesn\'t help</button>')
			.appendTo(wiz)
			.on('click', function() {
				stepChange(step.fail);
			});
	},

	'link': function() {
		step = unsafeWindow.step;
		stepChange(treeResolve(step.link));
	},

	'ask': function() {
		// Bails out after pre-populating the Ask Question form.
		// Leaves a nice message for the user so the understand what happened.
		step = unsafeWindow.step;

		msg = (!wiz.post) ? "We're sorry the wizard couldn't help you this time. Please fill in the form below with as much detail as you can manage." : "We have added collected data to the form below but please spend some time describing your problem in as much detail as possible.";
		$("#question-form").prepend($("<div class=\"wizardExit\">" + typogrify(msg) + "</div>"));

		$('#wmd-input').val(wiz.post);
		$("#tagnames").val(wiz.tags.join(', '));
		bail();
	},
};

function copyhelp() {
	$(wiz).append('<p class="helplink"><a href="http://askubuntu.com/questions/335770/how-can-i-run-a-command-and-copy-its-output/335771#335771" target="_blank">Help! How do I run a command in a terminal and copy the output?!</a></p>');
}

function codify(input) {
	return input
		.replace(/\n/g, '\n    ')
		.replace(/^/, '    ');
}

function typogrify(input) {
	return input.replace(/ ([^ ]+)$/, "&nbsp;$1");
}

function treeResolve(path){
    return (new Function('root', 'return root.' + path + ';'))(wizard_data);
}

function stepChange(step) {
	unsafeWindow.step = step;
	unsafeWindow.scrollTo(0, 82);

	if (step.tags) {
		wiz.tags = $.unique(wiz.tags.concat(step.tags));
		wiz.tags.splice(0, wiz.tags.length-5); // keep array 5 or less
	}

	$(wiz).empty();
	
	if (step.title)
		$(wiz).append('<h1>' + typogrify(step.title) + '</h1>');
	
	if (step.description) {
		desc = step.description
			.replace(/\$\{CODE\}/, '<code>' + (step.code || '') + '</code>');
		$(wiz).append('<p id="step_description">' + typogrify(desc) + '</p>');
	}
	
	// Hand off to the underlying handler for this step
	handlers[step.handler]();
}

function searchResults(q, fail) {
	$(wiz).empty();
	$(wiz).append('<h1>Do any of these questions match your problem?</h1>');
	$(wiz).append('<p id="step_description">We think a question similar to this might have been asked before.</p>');
	
	console.log('Searching for: ' + q);
	url = "http://api.stackexchange.com/2.1/search/advanced?pagesize=10&order=desc&sort=relevance&site=askubuntu&q=" + encodeURIComponent(q);
	// API search is knackered so we'll use the AU site search and jquery for now
	url = "http://askubuntu.com/search?tab=relevance&q=" + q;
	console.log(url);
	
	ul = $("<ul>");
	wiz.fail = fail;
	GM_xmlhttpRequest({
		method: "GET",
		url: url,
		onload: function(response) {
			if (response.responseText.match(/Your search returned no matches/i))
				return wiz.fail();

			var d = $(response.responseText);
			$(d).find('.search-results').appendTo(wiz);
			$(d).find('a').attr('target', '_blank');
			
			$('a#revert')
				.text("None of these help?")
				.unbind('click')
				.on('click', function(e){
					e.preventDefault();
					wiz.fail();
				});
		},
		onerror: function() {
			wiz.fail();
		}
	});
}

function bail() {
	$(wizardContainer).remove();
	$('#content').children().show();
}

function restart() {
	unsafeWindow.step = null;

	$('#content').children().hide();

	wizardContainer = $('<div id="wizardContainer"></div>')
		.appendTo('#content')
		.show();

	wiz = $('<div id="wizard"></div>')
		.appendTo(wizardContainer);
	wiz.post = "";
	wiz.tags = [];

	$('<div class="clear"></div>')
		.appendTo(wizardContainer);

	closeLink = $('<a class="bottomlink" id="revert" href="#">I can\'t see my problem here, ask a new question!</a>')
		.appendTo(wizardContainer)
		.on('click', function(e) {
			e.preventDefault();
			bail();
		});

	restartLink = $('<a class="bottomlink" href="#">Restart the wizard.</a>')
		.appendTo(wizardContainer)
		.on('click', function(e) {
			e.preventDefault();
			restart();
		});

	//Doing this with local data for the moment
	return stepChange(wizard_data);
}

// Only auto-load if the form is empty. Otherwise give the user a choice!
if ($('#wmd-input').val()) {
	banner = $("<div class=\"wizardExit\"><h3>The wizard hasn't load because you have already started a question.</h3>If you're sure you can </div>")
		.prependTo('#question-form');
	$('<a href="#">click here to start the wizard anyway!</a>')
		.on('click', function(e) {
			e.preventDefault();
			$('.wizardExit').remove();
			restart();
		})
		.appendTo(banner);
} else
	restart();