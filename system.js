// Class definition for System
// Requires math.js
function Species(initial_value, name) {
	this.value = initial_value;
	this.rate_laws = [];
	this.name = name;
	}

function Rule(expression, name) {
	this.expression = expression;
	this.name = name;
	}

function Parameter(value, name) {
	this.value = value;
	this.name = name;
	}
	
var System = {
	species: [],
	rules: [],
	parameters: [],
	parser: math.parser(),
	addSpecies: function(identifier, initial_value, name) {
		this.species[identifier] = new Species(initial_value, name);
		this.parser.eval(identifier + '=' + initial_value);
		},
	addParameter: function(identifier, value, name) {
		this.parameters[identifier] = new Parameter(value, name);
		this.parser.eval(identifier + '=' + value);
		},
	addRule:  function(identifier, expression, name) {
		this.rules[identifier] = new Rule(expression, name);
		this.parser.eval(expression);
		}
	//simulate: function(){},
	//create_model: function() {}
	}	

