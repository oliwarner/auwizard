// ==UserScript==
// @name        Ask Ubuntu WIZARD 
// @namespace   http://userscripts.org/users/217436
// @include     http://askubuntu.com/questions/ask
// @version     0.1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @grant		GM_getResourceText
// @resource	wizard_data   https://raw.github.com/oliwarner/auwizard/017701ecee24dd7569c63472829a952dda433846/wizard_data.json
// @resource	wizard_styles https://raw.github.com/oliwarner/auwizard/017701ecee24dd7569c63472829a952dda433846/styles.css
// ==/UserScript==

var $ = unsafeWindow.jQuery;
GM_log("PARTY TIME!");
var wizard_data = $.parseJSON(GM_getResourceText("wizard_data"));
$("head").append('<style type="text/css">' + GM_getResourceText("wizard_styles") + '</style>');

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

		msg = "The wizard has closed either because you asked for it or because it's out of options. ";
		if (wiz.post) msg += "The data the wizard collected has for pre-formatted and added to your post. ";
		msg += "It's over to you now. Write the best question you possibly can. Fully explain what the problem is and list any answers you've already tried.<br>";
		$("<div class=\"wizardExit\">" + msg + "</div>")
			.prependTo($("#question-form"))
			.append(
				$('<a href="">Or click here to restart the wizard.</a>')
					.on('click', function(e) {
						e.preventDefault();
						restart();
						$('.wizardExit').remove();
					})
			);
		msg = (!wiz.post) ? "We're sorry the wizard couldn't help you this time. Please fill in the form below with as much detail as you can manage." : "We have added collected data to the form below but please spend some time describing your problem in as much detail as possible.";
		$("#question-form").prepend();

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
			stepChange({'handler':'ask'});
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