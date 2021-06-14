// transform declaration registry into typescript declarations
import { getCommentLines } from '../annotation'
import * as Declaration from './registry'

function stringifyParameters(parameters: Declaration.Parameter[]): string {
	return parameters.map(
		({name,typename}) => `${name}: ${typename}`
	).join(', ')
}

function declarationForFunction(func: Declaration.Function): string[] {
	const {name,parameters,returnType} = func
	const parametersString: string = stringifyParameters(parameters)
	return [
		...getCommentLines(func.comment),
		`${name}(${parametersString}): ${returnType};`
	]
}

function declarationForProperty(property: Declaration.Property) {
	const {name,typename} = property
	return `${name}: ${typename}`
}

function declarationForEnum(declaredEnum: Declaration.Enum): string {
	const {name, values} = declaredEnum
	return [
		`export interface ${name} {}`,
		`interface ${name}Enum {`,
		...values.map( value => `${value}: ${name}`).map(indent),
		'}'
	].join('\n')
}

// TS is not responsible for enforcing number sizes (int8 vs int32 etc)
function declarationForNumber(name: string) {
	return `type ${name} = number;`
}

const staticName = (originalName: string) => `${originalName}Class`

// standalone declaration for class. used for typing
function memberDeclarationForClass(cppclass: Declaration.Class) {
	return [
		`export interface ${cppclass.name} {`,
		...cppclass.memberFunctions.map(declarationForFunction)
			.map(indentLines).map(joinLines),
		...cppclass.properties.map(declarationForProperty).map(indent),
		'}'
	].join('\n')
}

const declarationForConstructor =
		(cppclass: Declaration.Class) =>
		(constructor: Declaration.Constructor): string => 
{
	const params = stringifyParameters(constructor.parameters)
	const {name} = cppclass
	return `new (${params}): ${name};`
}

// static declaration for class. used to define type used for access
function staticDeclarationForClass(cppclass: Declaration.Class): string {
	const classname = staticName(cppclass.name)
	return [
		`interface ${classname} {`,
		...cppclass.staticFunctions
			.map(declarationForFunction)
			.map(indentLines)
			.map(joinLines),
		...cppclass.constructors
			.map(declarationForConstructor(cppclass)).map(indent),
		'}'
	].join('\n')
}

function declarationForClass(cppclass: Declaration.Class): string {
	return [
		memberDeclarationForClass(cppclass),
		staticDeclarationForClass(cppclass)
	].join('\n')
}

// module declaration for class. used for access
function moduleDeclarationForClass(cppclass: Declaration.Class) {
	const {name} = cppclass
	const staticClassName = staticName(name)
	return `${name}: ${staticClassName}`
}

function moduleDeclarationForEnum(declaredEnum: Declaration.Enum) {
	const {name} = declaredEnum
	return `${name}: ${name}Enum`
}

const indent = (text: string) => `\t${text}`
const indentLines = (lines: string[]): string[] => lines.map(indent)
const joinLines = (lines: string[]): string => lines.join('\n')

function declarationForModule(
		registry: Declaration.Registry
) {
	const lines = [
		"export interface CustomEmbindModule {",
		...registry.functions.map(declarationForFunction)
			.map(indentLines).map(joinLines),
		...registry.classes.map(moduleDeclarationForClass).map(indent),
		...registry.enums.map(moduleDeclarationForEnum).map(indent),
		"}",
		"declare function factory(): Promise<CustomEmbindModule>;",
		"export default factory;"
	]
	return lines.join('\n')
}


export function declarationsForRegistry(
		registry: Declaration.Registry
): string {
	return [
		'// generated by TSEMBIND',
		'',
		'// define type aliases for various native number types',
		...registry.numbers.map(declarationForNumber),
		'',
		...registry.enums.map(declarationForEnum),
		...registry.classes.map(declarationForClass),
		declarationForModule(registry)
	].join('\n')
}

module.exports = {declarationsForRegistry}
