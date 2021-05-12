// transform registry into typescript declarations

// duplicate definitions from embind.js because
// the original definitions arehidden behind closures
const readLatin1String = module => ptr => {                                     
    let str = "";                                                               
    let c = ptr;                                                                
    while (module.HEAPU8[c]) {                                                  
        str += String.fromCharCode(module.HEAPU8[c]);                           
        ++c;                                                                    
    }                                                                           
    return str;                                                                 
}

const heap32VectorToArray = module => (count, firstElement) => {
	const array = [];                                                           
	for (let i = 0; i < count; i++) {                                         
	  array.push(module.HEAP32[(firstElement >> 2) + i]);                          
	}                                                                         
	return array;                                                             
} 

const typeIdToTypeName = (module,registry) => typeId => {
	const ptr = registry.types[typeId]
	const str = readLatin1String(module)(ptr);
	console.log("read typename "+str)
	return str;
}

const getFunctionDeclaration = (module,registry) => funcInfo => {
	const {name,argCount,rawArgTypesAddr} = funcInfo;
	// TODO
	const nameStr = readLatin1String(module)(name)
	const argTypes = heap32VectorToArray(module)(argCount, rawArgTypesAddr);
	console.log(`argtypes for ${name}(): ${argTypes}`)
	const argTypeNames = argTypes.map(typeIdToTypeName(module,registry))
	const [returnType,...parameterTypes] = argTypeNames;
	return `declare function ${nameStr}(${parameterTypes}): ${returnType};`
}

const declarationsForRegistry = (module,registry) => {
	console.log(registry)
	return [
		[
			'type int = Number;'
		],
		registry.functions.
			map(getFunctionDeclaration(module,registry))

	].flat().join('\n')
}

module.exports = {declarationsForRegistry}
