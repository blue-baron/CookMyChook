/*jshint browser: true, jquery: true*/

//////////// -- VALIDATION OBJECT  --////////////
var validate = {
	addZero: function (num) {
		var makeInt = num * 1;//remove leading zero by multiplying by 1
		if (makeInt < 10) { makeInt = '0' + makeInt; }
		return makeInt;
	},
	
	validHrs: function (input) {
		var hrsFormat = /^([01]?\d|2[0-3])$/;
		var valid = hrsFormat.test(input);
		if (valid) {
			valid = this.addZero(input);
			return valid;
		}
	},
	
	validMinSec: function (input){
		var under60 = /^([01]?\d|[0-5][0-9])$/;
		var valid = under60.test(input);
		if (valid) {
			valid = this.addZero(input);
			return valid;
		}
	},
	
	autofillEmpty: function (parent, inputHrs, inputMin, inputSec) {
		var parentContainers = document.getElementsByClassName(parent);
				
		for (var i = 0; i < parentContainers.length; i++) {
			var parentContainer = parentContainers[i];
			var hours = parentContainer.getElementsByClassName(inputHrs)[0];
			var minutes = parentContainer.getElementsByClassName(inputMin)[0];
			var seconds = parentContainer.getElementsByClassName(inputSec)[0];
			
			if( !hours.value && !minutes.value && !seconds.value ) {
					hours.value = '';
					minutes.value = '';
					seconds.value = '';			
			}
			else if (!hours.value) {
				hours.value = '0';
				if (!minutes.value) {
					minutes.value = '0';
					}
				if (!seconds.value) {
					seconds.value = '0';	
					}		
			} else if (!minutes.value) {
				minutes.value = '0';
				if (!seconds.value) {
					seconds.value = '0';		
					}
			} else if (!seconds.value) {
				seconds.value = '0';	
			}	
		}

	}//end validate.autofillEmpty()

};//end validate object



////////////////////// -- TIMER OBJECT --//////////////////////

function Timer(name, hours, minutes, seconds) {
	this.name = name;
	this.id = name.replace(/ /g, '');	
	this.duration = new Date(0, 0, 0, hours, minutes, seconds, 0);
	this.handler = this.id + '_handler';
	this.scheduleHandler = '';
	this.ended = false;
}

//Timer prototype methods
Timer.prototype.startTimer = function () {
	var self = this;//reassign this
	this.handler = setInterval(function(){ return self.runTimer();}, 1000);
					
	document.getElementById(this.id + '_start').disabled = true;
	document.getElementById(this.id + '_stop').disabled = false;
};

Timer.prototype.runTimer = function() {				
	if (!this.ended) {
		var timerHrs = validate.addZero(this.duration.getHours()),
			timerMin = validate.addZero(this.duration.getMinutes()),
			timerSec = validate.addZero(this.duration.getSeconds());
			
			document.getElementById(this.id + '_countdown').innerHTML = timerHrs + ':' + timerMin + ':' + timerSec;
					
			if (this.duration.getHours() === 0 && this.duration.getMinutes() === 0 && this.duration.getSeconds() === 0) {	
			 	this.alarm();
				document.getElementById(this.id + '_countdown').innerHTML = 'Ended';
				document.getElementById(this.id + '_stop').disabled = true;         
    	        clearInterval(this.handler);
				this.ended = true;
				}//end if
			
			this.duration.setSeconds(this.duration.getSeconds() - 1);
		}//end if !ended
};

Timer.prototype.stopTimer = function (){ 
	clearInterval(this.handler);
	document.getElementById(this.id + '_start').disabled = false;
	document.getElementById(this.id + '_stop').disabled = true;
};

Timer.prototype.clearTimer = function(){
	//kill countdown
	this.stopTimer();
	clearTimeout(this.scheduleHandler);
	//alter interface
	document.getElementById(this.id + '_countdown').innerHTML = '';
	document.getElementById(this.id + '_start').disabled = true;
	document.getElementById(this.id + '_stop').disabled = true;
};

Timer.prototype.alarm = function(){
	var alarm = document.getElementById('alarm');
	alarm.volume = 0.5;
	alarm.play();
	
	//clone stop button.
	var	stopBtn = document.getElementById(this.id + '_reset'),
		alarmStopBtn = stopBtn.cloneNode(true);
	
	alarmStopBtn.id = this.id + '_alarmStop';
	alarmStopBtn.className += ' alarmStop';
	document.getElementById(this.id + "_btns").appendChild(alarmStopBtn);
				
	alarmStopBtn.onclick = function(){
		alarm.pause();
		alarm.currentTime = 0;
		//remove all alarm stop btns from interface. 
		//Loop backwards because stopBtns.length alters each time
		var alarmBtns = document.getElementsByClassName('alarmStop');
		for(var i = (alarmBtns.length - 1); i >= 0; i--) {
			alarmBtns[i].parentNode.removeChild(alarmBtns[i]);	
		}
	};
};


////////////////////// -- CONTROLLER OBJECT  --//////////////////////
var controller = {
	
	addTimers: function () {			
		//Select all .itemName & only process if is a 'select' or 'input' element.
		//jQuery mobile adds additional spans with same class name - not helpful!
		var unfliteredItems = document.getElementsByClassName('itemName');
		var 	menuItems = [];
		for (var h = 0; h < unfliteredItems.length; h++) {
			var itemType = unfliteredItems[h].tagName;
			if (itemType === 'SELECT' || itemType === 'INPUT') { 
				menuItems.push(unfliteredItems[h]);
			}	
		}
	
		var itemHrs = document.getElementsByClassName('itemHrs'),
			itemMin = document.getElementsByClassName('itemMin'),
			itemSec = document.getElementsByClassName('itemSec');
				
		for (var i = 0; i < itemHrs.length; i++) {
		//parse input create timer ONLY IF time is valid
			if (itemHrs[i].value && itemMin[i].value && itemSec[i].value) {
				// parse name input, create default name if not supplied
				var inputName = menuItems[i].value;
				if (!inputName) { inputName = 'Timer'; }
				//create new Timers
				var timer = new Timer(inputName, itemHrs[i].value, itemMin[i].value, itemSec[i].value);
				this.timers.push(timer);		
				}//end if inputTime		
			}//end for loop
		
		//add blank timers to timers array if this.timers length < 3
		if(this.timers.length < 3) {
			var count = 3 - this.timers.length;
			for (var j = 0; j < count; j++) {
				var blank = new Timer('Timer', 0, 0, 0);
				blank.ended = true;
				this.timers.push(blank);
			}
		}
	},//end addTimers
	
	timers: [],
									
	scheduleTimers: function () {
		//sort timers by duration in descending order
		this.timers.sort(function( a, b ){
			return new Date(b.duration) - new Date(a.duration);
			});	
		//Increment timer name/id to avoid bugs caused by duplicates
		var count = 1;	
		for (var h = 0; h < this.timers.length; h++) {
			this.timers[h].name = count + " - " + this.timers[h].name;
			this.timers[h].id = this.timers[h].name.replace(/ /g, '');
			count++;
		}
		
		var self = this;//reassign this for setTimeout to work
		var schedule = function (index, time){
			return setTimeout(function(){ 
				self.timers[index].startTimer();
				
				//sound alarm when all but the first timer starts 
				if(time > 0) { self.timers[index].alarm(); }
				}, time);
			}; 
			
			//create handlers for setTimeout
			for (var i = 0; i < this.timers.length; i++) {
				var timerDuration = this.timers[i].duration.getHours() + this.timers[i].duration.getMinutes() + this.timers[i].duration.getSeconds();
				
				if (timerDuration > 0 ) {
					var startTime = this.timers[0].duration - this.timers[i].duration;					
					this.timers[i].scheduleHandler = schedule(i, startTime);
				}  
			}//end schedule function
	},//end scheduleTimers
	
	overrideSchedule: function(index){
		clearTimeout(this.timers[index].scheduleHandler);
		this.timers[index].startTimer();
	},
					
	setDisplay: function () {
		for (var i = 0; i < this.timers.length; i++) {
			if (this.timers[i] instanceof Timer) {
				var timer = document.createElement('div'),
					timerId = this.timers[i].id;
				timer.id = timerId;
						
				timer.innerHTML = '<h1>' + this.timers[i].name + '</h1><div class="countdownWrapper"><div id="' + timerId + '_input"></div><div id="' + timerId + '_countdown" class="countdown"></div></div><div id="' + this.timers[i].id + '_btns" class="btnsWrapper"><button class="ui-btn play" id="' + timerId + '_start" onclick="controller.overrideSchedule(' + i +');">Start</button><button class="ui-btn pause" id="' + timerId + '_stop" onclick="controller.timers[' + i +'].stopTimer();">Stop</button><button class="ui-btn reset" id="' + timerId + '_reset" onclick="controller.resetTimer(' + i +');">Reset Timer</button></div>';
			
				document.getElementById('timerWrapper').appendChild(timer);
				document.getElementById(this.timers[i].id + '_countdown').innerHTML = validate.addZero(this.timers[i].duration.getHours()) + ':' + validate.addZero(this.timers[i].duration.getMinutes()) + ':' + validate.addZero(this.timers[i].duration.getSeconds());		
				}//end if
			}//end for
	},
	
	deleteOld: function () {
		//clear running & scheduled timers
		for(var i = 0; i < this.timers.length; i++) {
			this.timers[i].stopTimer();
			clearTimeout(this.timers[i].scheduleHandler);
		}
		//remove old timers
		this.timers.splice(0, this.timers.length);
		document.getElementById('timerWrapper').innerHTML = '';
		},//end deleteOld	
	
	resetInterface: function(index, type, name, parent){
		var newElement = document.createElement(type);
			newElement.id = this.timers[index].id + '_' + name;
			newElement.className += name;
		
		if (type === 'input') { newElement.setAttribute('placeholder', '00'); }
		if (type === 'button') { newElement.className += ' ui-btn'; }
		
		newElement = document.getElementById(this.timers[index].id + '_' + parent).appendChild(newElement);
	
	},//end resetInterface
						
	resetTimer: function(index){
		//clear timer
		this.timers[index].clearTimer();
		
		//Add class to parent container for autofillEmpty to function
		var parentContainer = document.getElementById(this.timers[index].id + '_input');
		parentContainer.className = 'resetInputs';
		
		//create interface elements allowing user to reset timer
		this.resetInterface(index, 'input', 'resetHrs', 'input');
		this.resetInterface(index, 'input', 'resetMin', 'input');
		this.resetInterface(index, 'input', 'resetSec', 'input');
		this.resetInterface(index, 'button', 'resetStart', 'btns');	
		
		//create play btn to start reset timer
		var resetBtn = document.getElementById(this.timers[index].id + '_resetStart');
		
		resetBtn.onclick = function(){
			
			validate.autofillEmpty('resetInputs', 'resetHrs', 'resetMin', 'resetSec');
			//get values from time input fields
			var resetHrs = document.getElementById(controller.timers[index].id + '_resetHrs'),
				resetMin = document.getElementById(controller.timers[index].id + '_resetMin'),
				resetSec = document.getElementById(controller.timers[index].id + '_resetSec'),
				resetTime = [resetHrs.value, resetMin.value, resetSec.value];
		
			if (resetTime) {
				//reset existing Timer
				controller.timers[index].duration.setHours(resetHrs.value, resetMin.value, resetSec.value, 0);
				controller.timers[index].ended = false;
				controller.timers[index].startTimer();
				
				//remove reset elements from interface		
				parentContainer.className = '';
				resetHrs.parentNode.removeChild(resetHrs);
				resetMin.parentNode.removeChild(resetMin);
				resetSec.parentNode.removeChild(resetSec);
				resetBtn.parentNode.removeChild(resetBtn);
				
				} else {
					resetHrs.value = '';
					resetMin.value = '';
					resetSec.value = '';	
					}	
		};//end onclick resetBtn
	}//end resetTimer
	
};//end controller



////////////////////// -- JQUERY FORM HANDLING  --//////////////////////
$(document).ready(function (){

	
	$('#alarm').on('load', function(){
		$(this).play();
		});
	//validate Timer Inputs on input change
	//Selection is 'delegated' through body so dynamically created reset fields can be selected.
	$('body').on('change', '.resetHrs, .itemHrs', function(){
		var valid = validate.validHrs( $(this).val() );
		if (valid) {
			$(this).val(valid);	
		} else {	
			$(this).val('00');
			}
		});
		
	$('body').on('change', '.resetMin, .resetSec, .itemMin, .itemSec', function(){
		var valid = validate.validMinSec( $(this).val() );
		if (valid) {
			$(this).val(valid);	
		} else {	
			$(this).val('00');
			}
		});	
	
	//Clear forms on panel close (so additional inputs from a closed form aren't accidentally processed).
	$( '.ui-panel' ).on( 'panelclose', function() {
		$(this).find('.setTimersForm').trigger('reset');
		} );
	
	//Preset times map
	var presetTimes = {
		'Roast Chicken 1.0kg':	[0, 60, 0],
		'Roast Chicken 1.2kg':	[1, 12, 0],
		'Roast Chicken 1.4kg':	[1, 24, 0],
		'Roast Chicken 1.6kg':	[1, 36, 0],
		'Roast Chicken 1.8kg':	[1, 48, 0],
		'Roast Chicken 2.0kg':	[2, 0, 0],
		'Roast Chicken 2.2kg':	[2, 12, 0],
		'Roast Asparagus': 		[0, 15, 0],
		'Roast Broccoli': 		[0, 15, 0],
		'Roast Capsicum': 		[0, 20, 0],
		'Roast Carrots': 		[0, 40, 0],
		'Roast Mushrooms': 		[0, 20, 0],
		'Roast Parsnips': 		[0, 40, 0],
		'Roast Potatoes': 		[1, 0, 0],
		'Roast Pumpkin': 		[0, 40, 0],
		'Roast Zucchini': 		[0, 15, 0],
		'Other': 				[0, 0, 0],
		'Timer': 				[0, 0, 0]
		};
	
	//Apply preset time according to selected name
	$('#chickenForm .itemName').on('change', function(){
	
		for (var property in presetTimes) {		
			if (this.value === property) {
				$(this).closest('.fieldset1').find('.itemHrs').val(validate.addZero(presetTimes[property][0]));		
				$(this).closest('.fieldset1').find('.itemMin').val(validate.addZero(presetTimes[property][1]));
				$(this).closest('.fieldset1').find('.itemSec').val(validate.addZero(presetTimes[property][2]));
				}
		}//end for	
	});//end .itemName on change
	
	//submit Set Timers form
	$('.runTimersBtn').click(function(){
		
		validate.autofillEmpty('timeInputs', 'itemHrs','itemMin', 'itemSec');
		
		controller.deleteOld();
		controller.addTimers();
		controller.scheduleTimers();
		controller.setDisplay();
		//direct to timers window
		window.location.replace('#timers');
		//only show 'no timers' msg if there are actually no timers.
		if (controller.timers.length === 0) {
			$('#noTimersMsg').show();
		} else {
			$('#noTimersMsg').hide();	
		}
		
		//Load alarm sound here because some browsers require a user gesture to load / play an audio element.
		//Restrictions are removed in more recent browsers after initial load or play call SO
		//alarm will work in these browsers after this call
		var alarm = document.getElementById('alarm');
		alarm.load();
	});// end runTimersBtn on click
	

});//end doc ready
