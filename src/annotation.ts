import * as Declaration from './declaration'

export interface Specifier {
	name: string
}

export interface ParameterAnnotation {
	name?: string
	typename?: string
}

export interface Annotated {
	comment?: string
	parameters?: Record<number,ParameterAnnotation>
}
export type Annotator = (specifier: Specifier) => Annotated | undefined

export function emptyHintFunction(specifier: Specifier) {
	return {comment:''}
}

export const  annotateFunction =
		(annotator: Annotator) => 
		(func: Declaration.Function): Declaration.Function => 
{
	const annotated = annotator(func)
	const newParameters = func.parameters.map((funcparameter,idx) => ({
		name: (annotated?.parameters||{})[idx]?.name || funcparameter.name,
		typename: (annotated?.parameters||{})[idx]?.typename || funcparameter.typename
	}))
	return {
		...func,
		comment: annotated?.comment,
		parameters: newParameters
	}
}

export const annotateClass = 
		(annotator: Annotator) =>
		(cppclass: Declaration.Class): Declaration.Class =>
{
	return {
		...cppclass,
		staticFunctions: 
			cppclass.staticFunctions.map(annotateFunction(annotator)),
		memberFunctions:
			cppclass.memberFunctions.map(annotateFunction(annotator))
	}
}

// mutates
export function annotateRegistry(
		registry: Declaration.Registry, annotator: Annotator
): Declaration.Registry {
	return {
		...registry,
		functions: registry.functions.map(annotateFunction(annotator)),
		classes: registry.classes.map(annotateClass(annotator))
	}
}

export function getCommentLines(comment?: string) {
	if (comment==undefined) return []
	else return comment.split('\n')
}