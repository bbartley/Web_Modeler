/** 
Interactive web simulator
@module System
*/

// Implements class inheritance in JavaScript explicitly rather than in JavaScript idioms
// See http://www.golimojo.com/etc/js-subclass.html
function subclass(constructor, superConstructor)
{
	function surrogateConstructor()
	{
	}

	surrogateConstructor.prototype = superConstructor.prototype;

	var prototypeObject = new surrogateConstructor();
	prototypeObject.constructor = constructor;

	constructor.prototype = prototypeObject;
}

/** 
A 'Species' is a state variable in a dynamic system.  It is left open
to the user's interpretation whether a Species refers to a biochemical
species or a biological species. Requires math.js
@class Species
@constructor
@param {Number} initial_value The initial quantity of this Species at the beginning of a simulation.
@param {String} name The identifier used to reference this Species object.
*/
function Species(initial_value, name) {

	/**
	A unique, descriptive identifier used to refer to the Species.  Examples are "R" or "rabbit"
	@property {String} name
	*/
	this.name = name;

	/**
	The quantity of this Species at the "present" time in a real-time simulation
	@property {Number} value
	*/
	this.value = initial_value;

	/**
	The rate law, represented by a Rule object, is an equation that describes 
	the rate of change of a Species in a dynamic System.  The rate_law contains a mathematical 
	expression that has been pre-parsed into a syntax tree.  The rate_law is compiled and
	passed to the simulator
	@property {Rule} rate_law
	*/
	this.rate_law = new Rule();

	/**
	An index used to match the Species to an internal state variable in the System equations
	@method indexOf
	@private
	@return {Number} The integer index of the corresponding state variable in the System equations
	*/
	this.indexOf = function(system, s_id) {
		return Object.keys(system.species).indexOf(s_id);
	}
	this.getVariable = function(system) {
		return;
	}
}

/** 
A Rule object represents a mathematical expression which may be compiled with other Rules
to compose even more complex mathematical expressions like equations.  
Currently, a Species.rate_law is determined by compiling the expressions contained in Rule objects.
The expression is treated like a term in the Species.rate_law. 
@class Rule
@constructor
*/
function Rule() {
	/**
	Currently a placeholder property.
	A name or description for this rule, eg, "Exponential Growth".
	@property {String} name
	*/
	this.name = null;
	
	/**
	The mathematical expression that defines this Rule. This expression is 
	already parsed into a syntax tree.  The expression property then points 
	to the root Node of the syntax tree.
	@property {Node} expression
	@private
	*/
	this.expression = null;
	
	/**
	Defines a Rule with the given name and associates it with the specified mathematical 
	equation.  The Rule expression is automatically evaluated into a syntax tree.
	@method set
	@param {String} expression A mathematical expression, eg '-alpha * A'
	@param {String} name The Rule name should match one of the member species in an Interaction.
	*/
	this.set = function(expression, name) {
		this.expression = math.parse(expression);
		this.name = name;
	}
	
	/**
	Print the Rule expression.
	@method toString
	*/
	this.toString = function() {
		console.log(this.expression.toString());
		}
}

/**
A Parameter is a mathematical constant that can be referenced in Rule expressions.
@class Parameter
@constructor
@private
@param {Number} value The numerical value of this mathematical constant
@param {String} name A full descriptive name for this parameter, eg "temperature"
*/
function Parameter(value, name) {
	/**
	The numerical value of this mathematical constant
	@property {Number} value
	*/
	this.value = value;

	/**
	The identifier used for this parameter, eg "T" for temperature
	@property {String} name
	*/
	this.name = name;
	}


/**
Interactions represent subsystem patterns within a larger System.
Member 'species' of an Interaction are represented by variables that are
locally scoped inside the Interaction (ie, the species variables can only be referenced
through mathematical expressions contained in the child Rule objects).
The Interaction describes mathematically what happens when members of the subsystem interact.
Examples include a Michaelis-Menten enzyme reaction with member species 'E', 'S', and 'P',
and a predator-prey interaction include member species 'Predator' and 'Prey'.
A child Rule is automatically created for each variable in the Interaction.
@class Interaction
@constructor
@param {System} system The parent System to which this Interaction will belong
@param {String} name A name or description given to the Interaction
@param {Array} species This list of species names lets the Interaction
know which symbols in mathematical expressions are variables and which are parameters.
A variable is created for each species listed.  Then a Rule comprising this Interaction 
is created for each variable.  Ex:  For an Interaction describing the mass-action
collision of two molecules described by k * A * B the variables are A & B
*/
function InteractionDefinition(system, name, species) {
	/**
	The parent system that this Interaction belongs to
	@property {System} system
	*/
	this.system = system;
	
	/**
	A name or description given to the Interaction
	@property {String} name
	*/
	this.name = name; // name or description for the interaction, eg "Predator-prey", see "giveName"

	/**
	Auto-construct a child Rule object for each species.
	Then register it in this Interaction's scope using the variables field
	@method addRule
	@private
	*/
	this.addRule = function(variable) {
		this.rules[variable] = new Rule();
		}
	
	/**
	An Object containing all the Rules that comprise this Interaction.  There is usually one Rule
	corresponding to each Species in the Interaction.  So an Interaction between two Species "A" & "B"
	will have Rules "A" and "B".
	@property {Object} rules
	*/
	this.rules = {};
	// Registers the new rule but doesn't initialize the expression or name
	for (var s_id in species) {
		//console.log(species[s_id]);
		this.addRule(species[s_id], null,  null);  
		}
	//this.variables = [];  // variables parsed from rules and contained in this Interaction's local scope
	//this.parameters = []; // parameters parsed from rules and contained in this Interaction's local scope

	/**
	Getter for variables in this Interaction.
	TODO:  Perhaps this should be a property?  Tried using get variables() here, 
	but doesn't seem to work inside a constructor function 
	@method variables
	@return {Array} Returns an array of all variable identifiers (and their corresponding Rules used 
	to define this Interaction
	*/
	this.variables = function() {
		return Object.keys(this.rules);
	}
	
	// Iterate through each child Rule and filter out all the Symbols.  Keep only nodes 
	// with parameters that aren't already in the array (if they were found in a previous Rule)
	// It's inefficient to identify Parameters in the Rule's local scope this way,
	// but given the small size of our Interactions in practice probably not a big deal
	// We might consider forcing the user to specify the parameters when the Rule is defined
	/**
	Getter for parameters in this Interaction.
	@method parameters
	@return {Array} Returns an array of all parameters referenced in this Interaction
	*/
	this.parameters = function() {
		var parameters = [];
		var p_nodes = [];
		var p_names = [];
		var variables = this.variables()
		for (r_id in this.rules) {
			if (this.rules[r_id].expression) {
				p_nodes = this.rules[r_id].expression.filter(function (node) { 
					// return (node.type == 'SymbolNode' && 
							// !(node.name in variables) &&
							// !(node.name in parameters));
					return (node.type == 'SymbolNode' &&
							variables.indexOf(node.name) == -1 &&
							parameters.indexOf(node.name) == -1)
				});
				p_names = p_nodes.map(function(node) { return (node.name) });
				parameters = parameters.concat(p_names);
			}
		}
		return parameters;
	}
	
}

// Instantiate an Interaction inside the system. The v_args and p_args 
// are substituted into the InteractionDefinition's v_ids and p_ids.
subclass(Interaction, InteractionDefinition);
function Interaction(base, v_args, p_args) {
	// Copy the base object but with new Species
	InteractionDefinition.call(this, base.system, base.name, v_args);
	// Clone the Rule expressions
	for (var i_r=0; i_r < Object.keys(base.rules).length; i_r++) {
		var old_rule = base.rules[ Object.keys(base.rules)[i_r] ];
		var new_rule = this.rules[ Object.keys(this.rules)[i_r] ];
		// The following line doesn't work.  Clone() behaves unexpectedly
		// it appears to copy by reference rather than creating a new expression tree object
		//new_rule.expression = old_rule.expression.clone();
		
		//Debugging output
		console.log(Object.keys(base.rules)[i_r]);
		console.log(old_rule);
		if (old_rule.expression) {
			new_rule.set( old_rule.expression.toString() );
		}
	}
	// // Copy the Rules from the base InteractionDefinition
	// for (var i_arg=0; i_arg < v_args.length; i_arg++) {
		// var old_rule_id = v_ids[i_arg];
		// var new_rule_id = symbol_table[old_rule_id];
		// this.rules[new_rule_id] = new Rule();
		// this.rules[new_rule_id].expression = base.rules[old_rule_id].expression.clone();
		// delete this.rules[old_rule_id];
		// console.log(this.rules[new_rule_id].expression);
		// }

	var v_ids = base.variables();
	var p_ids = base.parameters();
	var symbol_table = {};  // maps { Rule symbol : Interaction argument } 
		
	// Validate that v_args and p_args are valid Species and Parameters
	for (var i_arg=0; i_arg < v_args.length; i_arg++) {
		if (Object.keys(this.system.species).indexOf(v_args[i_arg]) == -1)  { 
			return; 
		}
	}
	for (var i_arg=0; i_arg < p_args.length; i_arg++) {
		if (Object.keys(this.system.parameters).indexOf(p_args[i_arg]) == -1)  { 
			console.log('addInteraction: Invalid Parameter argument');
			return; 
		}
	}
	
	// Validate that the correct count of symbol arguments (v_args, p_args) is specified
	// It should match the count of symbols in the base definition
	if (v_args.length != v_ids.length) { 
		console.log('addInteraction:  Expected variables ', v_ids, ' got ', v_args);
		return; 
	}
	if (p_args.length != p_ids.length) { 
		console.log('addInteraction:  Expected parameters', p_ids, ' got ', p_args);
		return; 
	}
				
	// map variable arguments to variable symbols in expression tree
	// in order which rules were assigned
	for (var i_arg=0; i_arg < v_args.length; i_arg++) {
		symbol_table[v_ids[i_arg]] = v_args[i_arg];
		}

	// map parameter arguments to parameter symbols in expression tree
	// every symbol that's not already a member of rule_ids 
	for (var i_arg=0; i_arg < p_args.length; i_arg++) {
		symbol_table[p_ids[i_arg]] = p_args[i_arg];
		}
	
	// // map parameter arguments to parameter symbols in expression tree
	// // every symbol that's not already a member of rule_ids 
	// console.log(symbol_table);
	// console.log(name);
	// var i_p = 0;
	// for (var id in v_ids) {
		// console.log(id);
		// var expr_node = this.interactions[name].rules[id].expression;
		// expr_node.traverse(function (node, path, parent) {
			// if (node.type == 'SymbolNode' && !(node.name in symbol_table)) {
				// symbol_table[node.name] = p_args[i_p];
				// i_p++;
			// }
		// });
	// }
	// console.log(name);
	// console.log(this);
	
	//Substitute variable arguments and parameter arguments for variables and parameters in 
	//Interaction's local scope
	for (var r_id in this.rules) {
		// Make a copy of the Rule's expression syntax tree so we can overwrite
		// variables and parameters with the Interaction's arguments.  In effect,
		// this instantiates the Interaction
		// var expression_tree = this.system.interactions[name].rules[r_id].expression.clone();
		// var expression_tree = math.parse(this.system.interactions[name].rules[r_id].expression.toString());
		
		var nodes = [];
		
		// Filter SymbolNodes out of the syntax tree
		if (this.rules[r_id].expression) {
			var nodes = this.rules[r_id].expression.filter(function (node) { 
				return (node.type == 'SymbolNode') 
			});

			for (i_n = 0; i_n < nodes.length; i_n++) {
				var node = nodes[i_n];
				// Look up the argument symbol in the Interaction's local symbol table
				// then substitute in the expression syntax tree
				if (Object.keys(symbol_table).indexOf(node.name) != -1) {
					node.name = symbol_table[node.name];
				}
			}
		}
	}
		
		// Build the syntax tree for the rate law expression
		// var s_id = symbol_table[r_id]; // Get Species id corresponding to this Rule
		// console.log(s_id, this.system.species[s_id].name);

		// // Update the rate laws of the participant Species
		// // Moved to compile method
		// if (this.system.species[s_id].rate_law.expression != null) {
			// this.system.species[s_id].rate_law.expression = new math.expression.node.OperatorNode('+',
				// 'add',[this.system.species[s_id].rate_law.expression, expression_tree]);				
		// } else {
			// this.system.species[s_id].rate_law.expression = expression_tree.clone();
		// }
		// this.system.species[s_id].rate_law.toString();
	

	// I tested mathjs library's transform function to replace nodes, but it didn't work
	// console.log(rule_id);
	// console.log(this.interactions[name].rules[rule_id].toString());
	// for (var rule_id in this.interactions[name].rules) {
		// expr_node = expr_node.transform(function (node, path, parent) {
			// if (node.type == 'SymbolNode') {
				// console.log(node.name, symbol_table[node.name]);
				// return node;  // didn't work
				// node.name = symbol_table[node.name];  // didn't work either
				// return new math.expression.node.SymbolNode(symbol_table[node.name]);
			// } else {
				// return node;
			// }
		// });
		// console.log( name);
		// this.interactions[name].rules[rule_id].expression = expr_node;
		// console.log(this.interactions[name]);
		// console.log(this.interactions[name].rules[rule_id].toString());
	// }
}

/**
Simulation objects contain the results of a dynamic simulation of a model system.
@class Simulation
@constructor
@param {Array} species An array that lists which Species were members of the System 
when it was simulated
@param {Object} solution An object returned by numeric.dopri ODE integrator
*/
function Simulation(system, solution) {
	/**
	Contains the time points corresponding to the state trajectory.
	@property {Array} time
	*/
	this.time = [0];
	if (solution) {
		this.time = solution.x;
	}
	
	/**
	The trajectory contains the dynamic time series for each species.
	@property {Object} trajectory
	*/
    this.trajectory = {};
	// Initialize the trajectory dictionary with state trajectories for each species listed in 
	// the argument. The trajectories are found by re-arranging the integrator's solution object
	if (system) {
		if (solution) {
			var y = numeric.transpose(solution.y)
			for (sp in system.species) {
				this.trajectory[sp] = y[Object.keys(system.species).indexOf(sp)]
			}
		} else {
			for (sp in system.species) {
				this.trajectory[sp] = [ system.species[sp].value ];
			}
		}
	}
		
	this.real_time_simulation = null;
			
	/**
	Concatenate trajectories from two simulation objects. 
	@method concat
	@return {Simulation} A new Simulation object
	*/
	this.concat = function(other_simulation) {
		// Find union of species identifiers in the simulations you are concatenating
		// This code should maybe get factored out
		var these_species = Object.keys(this.trajectory);
		var those_species = Object.keys(other_simulation.trajectory);
		var combined_species = these_species.concat(those_species).sort();
		var union = [];
		union[0] = combined_species[0];
		combined_species.reduce(function(sp1, sp2) { if (sp2 != sp1) union.push(sp2); return sp2 });
		
		// Concatenate trajectories, while padding missing trajectory values with undefined
		var concatenated_trajectory = {}
		for (i_u in union) {
			if (this.trajectory[union[i_u]] == undefined) {
				concatenated_trajectory[union[i_u]] = Array(this.time.length);
				concatenated_trajectory[union[i_u]] = concatenated_trajectory[union[i_u]].concat(other_simulation.trajectory[union[i_u]]);
			} else if (other_simulation.trajectory[union[i_u]] == undefined) {
				concatenated_trajectory[union[i_u]] = this.trajectory[union[i_u]];
				concatenated_trajectory[union[i_u]] = concatenated_trajectory[union[i_u]].concat(Array(other_simulation.time.length));
			} else {
				concatenated_trajectory[union[i_u]] = this.trajectory[union[i_u]];
				concatenated_trajectory[union[i_u]] = concatenated_trajectory[union[i_u]].concat(other_simulation.trajectory[union[i_u]]);
			}
		}	
		// Concatenate independent variable / time vector
		var tf = this.time[this.time.length-1];
		var concatenated_time = this.time.concat(
			other_simulation.time.map(function(t) {return t + tf;} ));
		
		concatenated_simulation = new Simulation(null, null);
		concatenated_simulation.time = concatenated_time;
		concatenated_simulation.trajectory = concatenated_trajectory;
		return concatenated_simulation;
	}

	/**
	Trim old state history that exceeds the time window specified by the buffer_size parameter
	@method trim
	@param {Number} buffer_size The time window
	*/
	this.trim = function(buffer_size) {
		var t0 = this.time[this.time.length-1] - buffer_size;
		var i_t0 = this.time.indexOf(t0);
		for (var i_t=0; i_t < i_t0; i_t++) {
			this.time.shift();
		}
		for (var id_tr in this.trajectory) {
			for (var i_t=0; i_t < i_t0; i_t++) {
				this.trajectory[id_tr].shift();
			}
		}
		return this;
	}
	
	/**
	Plot Simulation trajectories.
	@method plot
	@param div DOM element in which the plot will be inserted into html page
	*/
	this.plot = function(div, plot_config) {
		var species = Object.keys(this.trajectory);
		var data = [];
		for (i_sp in species) {
			var series = numeric.transpose([this.time, this.trajectory[species[i_sp]]]);
			data.push({data:series});
		}


		$(function() { $.plot("#" + div, data, plot_config); });
	}
	
	this.update_state = function(system, config, div) {
		// Construct and initial values vector for the integrator 
		var initial_values = [];
		for (var id_tr in this.trajectory) {
			initial_values.push(this.trajectory[id_tr][this.trajectory[id_tr].length-1]);
		}

		// Simulate for one time step
		var t_step = config.refresh_rate / 1000 * config.t_scale;  // in units of seconds
		var solution = numeric.dopri(0,t_step,initial_values,system.dY,1e-6,10000, function() {return -1}, [
				system]);
		
		// Update the Simulation object's state trajectory
		var y = numeric.transpose(solution.y)
		for (var id_tr in this.trajectory) {
			var i_y = Object.keys(this.trajectory).indexOf(id_tr);
			this.trajectory[id_tr] = this.trajectory[id_tr].concat(y[i_y]);
		}
		// Update the System's state
		//for (var id_sp in system.species) {
		//	system.species[id_sp].value = this.trajectory[id_sp][this.trajectory[id_sp].length-1];
		//}
		
		// Update the time vector
		var t_offset = this.time[this.time.length-1];
		this.time = this.time.concat(solution.x.map(function(t) { return t + t_offset; }));
		
		// If the state history exceeds the buffer, remove stale
		// part of the history
		var state_history_length = this.time[this.time.length-1] - this.time[0];
		if (state_history_length > config.buffer_size) {
			this.trim(config.buffer_size);
		}

		var t_min = this.time[0];
		var t_max = this.time[0] + config.buffer_size;
		var plot_config = {
			series: {
				shadowSize: 0	// Drawing is faster without shadows
			},
			yaxis: {
				min: 0,
				max: 10
			},
			xaxis: {
				min: t_min,
				max: t_max
			}
		}		
		this.plot(div, plot_config);
	}
}

/**
A Config object contains configuration options for real-time animation.
@class Config
@constructor
*/
function Config() {
	this.current_state = [];
	this.initial_state = [];
	this.state_history = {};  // trajectories of 1 or more state variables
	this.t_plus = [0];
	this.t_minus = [0];
	this.run_time = 10000; // maximum animation time in milliseconds
	this.fps = 80;
	this.refresh_rate = 1/this.fps * 1000;   // milliseconds
	this.buffer_size = 10;  // simulation time
	//this.t_scale = 10;  // 1 second of clock time corresponds to 10 seconds simulation time
	this.t_scale = 5;  // 1 second of clock time corresponds to 5 seconds simulation time
}

/**
System is the main class.  A System may represent a biochemical system or an ecological system that
can be simulated.
@class System
*/
var System = {
	/**
	Configuration options for simulation and real-time animation.
	@property {Config} config
	*/
	config: new Config(),	
	
	/**
	Species objects belonging to a System may be referenced by name through the System.species property.
	@property {Object} species
	*/
	species: {},

	/**
	Rule objects belonging to a System may be referenced by name through the System.rules property.
	@property {Object} rules
	*/
	rules: {},

	/**
	Parameter objects belonging to a System may be referenced by name through the System.rules property.
	@property {Object} parameters
	*/
	parameters: {},

	/**
	Interaction objects belonging to a System may be referenced by name through the System.interactions property.
	@property {Object} interactions
	*/
	interactions: {},

	/**
	Registers all the Interaction instances in the System.
	@property {Object} _interactions
	@private
	*/
	_interactions: [],
	
	/**
	The symbol_table is used internally to map Species objects to their respective state variables 
	when the System.model is compiled.
	@property {Array} symbol_table
	@private
	*/
	symbol_table: [],

	/**
	Compiled rate_law expressions for each Species.  Each array element contains a mathematical
	expression that has been compiled using the mathjs library.
	@property {Array} model
	@private
	*/
	model: [],

	/**
	This property points to a Parser object from the mathjs library. It contains the global System 
	symbol table used by a simulation to evaluate the rate laws that define a Species rate of change.
	The parser scope contains identifiers for Parameter, Species, and Rule objects owned by the 
	parent System.
	@property {math.Parser} parser
	@private
	*/
	parser: math.parser(),

	/**
	Auto-construct a new Species and register it in the System
	@method addSpecies
	@param {String} identifier A short-hand symbol or identifier used to reference the new Species object from
	the parent System
	@param {Number} initial_value The initial number or quantity of this Species present in the System
	@param {String} name The full, descriptive name for the Species
	*/
	addSpecies: function(identifier, initial_value, name) {
		// Create new Species and register it in the System
		this.species[identifier] = new Species(initial_value, name);
		this.model[Object.keys(this.species).length-1] = null;
		console.log(Object.keys(this.species).length, this.model);

		//this.species[identifier] = new Species(initial_value, name);
		// Register the Species' instance number in System's global symbol map
		// This instance number will map to a state variable index in the simulation
		// Deprecated
		// this.symbol_table[Object.keys(this.species).length] = identifier;
		// this.parser.eval(identifier + '=' + initial_value);
	},

	/**
	Remove a Species and all Interactions that this Species participates in from the System.
	@method removeSpecies
	@param {String} identifier A short-hand symbol or identifier specifying the Species to 
	remove from the System
	*/
	removeSpecies: function(identifier) {
		// Create new Species and register it in the System
		// this.species[identifier] = new Species(initial_value, name);;
		this.removeInteractionsBySpecies([identifier]);
		this.model.splice(Object.keys(this.species).indexOf(identifier), 1);
		delete this.species[identifier];
		console.log(this.species, this.model);
	},
	
	/**
	Auto-construct a new Parameter and register it in the System
	@method addParameter
	@constructor
	@param {String} identifier A shorthand identifier used to reference the new Parameter object 
	in the parent System.
	@param {Number} value A constant value for this Parameter
	@param {String} name A full, descriptive name for the new Parameter
	*/
	addParameter: function(identifier, value, name) {
		this.parameters[identifier] = new Parameter(value, name);
		this.parser.eval(identifier + '=' + value);
	},
	
	// // Deprecated
	// addRule:  function(identifier, expression, name) {
		// this.rules[identifier] = new Rule(expression, name);
		// this.parser.eval(expression);
	// },

	/**
	Define a new Interaction definition and register the definition in the System.
	@method defineInteraction
	@constructor
	@param {String} identifier A short-hand symbol or identifier used in mathematical expressions that
	define the mathematical Rules that describe this dynamic System.  The identifier is also used 
	to reference the new Parameter object in the parent System.
	@param {Number} initial_value The initial number or quantity of this Species present in the System
	@param {String} name The full, descriptive name for the Interaction
	*/
	defineInteraction:  function(name, species) {
		this.interactions[name] = new InteractionDefinition(this, name, species);
	},
		
	/**
	Adds an instance of an Interaction to the System.  Local variables used in the Interaction
	definition are overwritten with global System variables.  For example, a "predator-prey"
	Interaction might be instantiated twice within a System, once for "fox" and "hare", and once
	more for "eagle" and "hare".
	@method addInteraction
	@param {String} name The identifier used to retrieve the Interaction definition from the
	parent System
	@param {Array} v_args An array of Species identifiers.  This array specifies which 
	Species identifiers to substitute in for the local variables used by this Interaction
	@param {Array} p_args An array of Parameter identifiers.  This array specifies which 
	Parameter identifiers to substitute in for the local parameters used by this Interaction
	This allows one to pass in global system parameters.
	*/
	addInteraction: function(id, v_args, p_args) {
		var base_definition = this.interactions[id];
		var i = new Interaction(base_definition, v_args, p_args);
		this._interactions.push( i );
	},

	/**
	Remove all Interaction instances with the participant Species specified in the argument
	@method removeInteractionsBySpecies
	@param {Array} identifiers Identifiers for Species used to target the Interaction instances
	for removal
	*/
	removeInteractionsBySpecies: function(identifiers) {
		for (i_id in identifiers) {
			target_id = identifiers[i_id];
			// Search the System's list of interaction instances for the target
			// and delete them.  
			// The list of interactions is searched from back to front, so that
			// deletions can be made without affecting the array indexes of the remaining
			// interactions
			for (i__int=this._interactions.length-1; i__int >= 0; i__int--) {
				var interaction = this._interactions[i__int];
				if (interaction.variables().indexOf(target_id) != -1) {
					this._interactions.splice(i__int, 1);
				}
			}
		}
	},

	/**
	Remove all Interaction instances that share the specified InteractionDefinition
	@method removeInteractionsByName
	@param {String} name The name of the InteractionDefinition for the targeted
	Interaction instances.
	*/
	removeInteractionsByName: function(name) {
		for (i__int=this._interactions.length-1; i__int >= 0; i__int--) {
			var interaction = this._interactions[i__int];
			if (interaction.name == name) {
				this._interactions.splice(i__int, 1);
			}
		}
	},
	
	/**
	Simulate the System model.
	@method simulate
	@param {Number} t0 The initial time
	@param {Number} tf The final time
	*/
	simulate: function(t0, tf) {
    	var initial_values = [];
		var i_sp = 0;
		for (var sp in this.species) {
			// Compile the rate_law for this species and attach to the System.model field
			if (this.species[sp].rate_law.expression != null) {
				this.species[sp].rate_law.expression.toString();
				this.model[i_sp] = this.species[sp].rate_law.expression.compile(math)
			} else {
				// @todo What to do if a rate law for a species has not been defined?
				// @todo move to System constructor
				// For now just assume that its rate of change is zero
				this.model[i_sp] = math.compile("0");
			}
			// Add this Species' initial value to the initial values vector
			initial_values[i_sp] = this.species[sp].value;
			i_sp++;
			// Maybe not necessary, since initial values are already declared in the System.parser
			// upon Species creation
			
			// Substitute symbols in and compile
			// @TODO:  Try to get the following working:
			// var expression_tree = this.interactions[name].rules[r_id].expression.clone();
			// var new_expression_tree = math.parse(this.species[sp].rate_law.expression.toString());
			// Not necessary to do this either, expression tree has already been substituted
			// with simulation variables from the System.symbol_table when an Interaction was
			// instantiated

			//console.log('Substituted Rule:', r_id );
			//this.interactions[name].rules[r_id].toString();
		}
		// Execute simulation
		var solution = numeric.dopri(t0,tf,initial_values,this.dY,1e-6,10000, function() {return -1}, [
		this]);
		var simulation = new Simulation(Object.keys(this.species), solution);
		console.log(simulation);
		// Update the value of Species objects to their final value at end of simulation
		for (var sp in this.species) {
			console.log(sp);
			this.species[sp].value = simulation.trajectory[sp][simulation.trajectory[sp].length-1];
		}
		return simulation;
		//return this.odeInt(initial_values, 0, 0.1, 100);
	},
	
	/**
	Builds an expression tree for each Species' rate law.  Compiles the syntax tree using mathjs.
	The compiled code is saved in the System.model property and later evaluated by the simulate method.
	@method compile
	*/
	compile: function() {
		
		// Initialize rate law expressions
		for (var sp in this.species) {
			this.species[sp].rate_law.expression = null;
		}
		
		// Gather all the mathematical terms contained in Interaction rules and
		// build them into a rate law 
		for(var i in this._interactions) {
			var interaction = this._interactions[i];
			participant_ids = interaction.variables();
			for(i_p in participant_ids) {
				
				// Get participant Species that participates in this Interaction
				var participant_id = participant_ids[i_p]; 
				var participant = this.species[participant_id];
				
				// Check if the rule is defined first (some rules in an Interaction may be uninitialized)...
				if (interaction.rules[participant_id].expression) {
					// Initialize the rate law if this is the first time 
					// this participant Species has been found in an Interaction
					if (participant.rate_law.expression == null) {
						participant.rate_law.expression =
							interaction.rules[participant_id].expression.clone();
					// ...else add the new term to the rate law
					} else {
						participant.rate_law.expression = 
							new math.expression.node.OperatorNode('+','add', [participant.rate_law.expression, 
							interaction.rules[participant_id].expression.clone()]);				
					}
				}
			}
		}
		// Compile the rate_laws and attach to the System.model field
		for (var sp in this.species) {
			var i_sp = Object.keys(this.species).indexOf(sp); 
			console.log(i_sp, sp);
			if (this.species[sp].rate_law.expression != null) {
				this.species[sp].rate_law.expression.toString();
				this.model[i_sp] = this.species[sp].rate_law.expression.compile(math)
			} else {
				// @todo What to do if a rate law for a species has not been defined?
				// @todo move to System constructor
				// For now just assume that its rate of change is zero
				this.model[i_sp] = math.compile("0");
			}
		}
	},
	
	
	// @TODO:  pass the System as an argument to dY so that its properties can be accessed
	// when numeric.dopri invokes dY as a callback, changing the context for 'this' object
	/**
	The differential rates-of-change for all Species in a System.  The signature of the differential
	function must match that expected by the ODE integrator or other simulation operator function.
	The params argument is exploited to pass in a pre-compiled model from the outside. Thus the model 
	equations do not have to be hard-coded inside the differential function and may be modified
	on the fly in response to external events (from the GUI for example).
	@method dy
	@private
	@param {Number} t A single float value corresponding to a particular time in a simulation
	@param {Number} y An array of state variables.
	@param {Array} params An array that can be used to pass other external information into
	the differential function
	@return Returns the rate-of-change for all Species in the System at time t
	*/
	dY: function(t, y, params) {
		// @TODO:  add validation step here.  Check for valid System object passed in params argument
		system = params[0];
		var species_ids = Object.keys(system.species);
		//if (t==0){
		//	console.log(species_ids);
		//}
		var dy = [];
		// Construct a scope object by mapping the current values of the javascript simulation variable
		// with the corresponding variable identifier in the System scope (ie, the species id)
		// @TODO: More efficient to allocate array dimensions first?
		var scope = {};
		for (var i_y = 0; i_y < y.length; i_y++) {
			//this.parser.eval(simulation_vars[i_y] + "=" + y[i_y])
			scope[species_ids[i_y]] = y[i_y];
		}
		if (t==0) {
			console.log(scope);
		}
		for (p in system.parameters) {
			//scope[p] = this.parameters[p].value;
			scope[p] = system.parameters[p].value;
		}
		//if (t==0){
		//	console.log('Scope:',scope);
		//}
		
		// Calculate the differentials in the System parser scope,
		// then copy back to the javascript simulation variable
		for (var i_y = 0; i_y < y.length; i_y++) {
			//dy[i_y] = this.parser.eval(this.model[i_y]);
			//dy[i_y] = this.model[i_y].eval(scope);
			dy[i_y] = system.model[i_y].eval(scope);
		}
		return dy;
	},
	
	// Deprecated, Euler's method used for testing
	odeInt: function(y0, t0, t_step, tf) {
		var n_intervals = (tf - t0) / t_step;
		var t = numeric.linspace(t0, tf, n_intervals);
		var yf = []; // vector of state variables after a time step
		var Y = [ y0 ]; // cumulative state history over entire simulation
		for (n = 1; n <= n_intervals; n++) {
			var dy = this.dY(t, y0);
			// Iterate over each state variable and integrate over a single time step
			for (var i_y = 0; i_y < y0.length; i_y++) {
				yf[i_y] = y0[i_y] + dy[i_y] * t_step;
			}
			Y[n] = yf.slice();  // Slice is necessary to copy array by value rather than copy by reference
			y0 = yf;
		}
		sol = { x: t, y: Y };  // Solution is structured the same as that returned by numeric.dopri
		return sol;
	},
	
	simulate_in_real_time: function(div) {
		var state_history = new Simulation(this, null);
		var sys = this;
		state_history.real_time_simulation = setInterval(function() { 
			state_history.update_state(sys, sys.config, div); },
			sys.config.refresh_rate);
		return state_history;
	}

	// simulate_in_real_time: function(div, run_time, config) {
        // var t_step = config.refresh_rate / 1000 * config.t_scale;  // in units of seconds
		// var i_stop  = run_time / t_step;
		// var state_history = new Simulation(null, null);
		// console.log(state_history);
		// // Initialize state vector from the current value of Species objects 
		// var initial_state = [];
		// for (var sp in this.species) {
			// initial_state.push(this.species[sp].value);
		// }
		// for (var i=0; i <= i_stop; i++) {
			// var solution = numeric.dopri(0,t_step,initial_state,this.dY,1e-6,10000, function() {return -1}, [
					// this]);
			// var new_state = new Simulation(Object.keys(this.species), solution);
			// // Update the value of Species objects to their final value at end of simulation
			// var initial_state = [];
			// for (var sp in this.species) {
				// var new_value = new_state.trajectory[sp][new_state.trajectory[sp].length-1];
				// this.species[sp].value = new_value;
				// initial_state.push(new_value);
			// }
			// // Update the System's cumulative state history.
			// // If the state history exceeds the buffer, remove stale
			// // part of the state history
			// console.log(state_history);
			// if (state_history.time.length == 0) {
				// state_history = new_state;
			// } else {
				// var time_window = state_history.time[state_history.time.length-1] - state_history[0];
				// if (time_window < config.buffer_size) {
					// state_history = state_history.concat(new_state);
				// } else {
					// state_history = state_history.concat(new_state);
					// state_history = state_history.trim(config.buffer_size);
				// }
			// }
			// //console.log(initial_state);
			// //console.log(new_state);
			// //console.log(state_history);
			// //throw new Error();
		// }
		// return state_history;
	// }
}	

