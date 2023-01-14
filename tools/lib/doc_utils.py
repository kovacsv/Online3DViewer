import re
import html
from enum import Enum

def CleanUpText (text):
    if text == None:
        return ''
    invalidChars = ['\r', '\n', '\t']
    for invalidChar in invalidChars:
        text = text.replace (invalidChar, ' ')
    text = html.escape (text)
    return text

def GenerateLink (entityName, entityLink):
    target = '_blank' if entityLink.startswith ('http') else '_self'
    return '<a href="{1}" target="{2}">{0}</a>'.format (entityName, entityLink, target)

def FinalizeType (text, entityLinks):
    text = CleanUpText (text)
    arrayMatch = re.match ('Array\.&lt;(.+)&gt', text)
    if arrayMatch != None:
        matchedName = arrayMatch.group (1)
        if matchedName in entityLinks:
            return GenerateLink (matchedName, entityLinks[matchedName]) + '[]'
        else:
            return arrayMatch.group (1) + '[]'
    if text in entityLinks:
        return GenerateLink (text, entityLinks[text])
    return text

def ReplaceLinksInText (text, entityLinks):
    links = re.findall ('{@link ([^{}]+)}', text)
    for link in links:
        if link in entityLinks:
            text = text.replace ('{@link ' + link + '}', GenerateLink (link, entityLinks[link]))
        else:
            text = text.replace ('{@link ' + link + '}', link)
    return text

def FinalizeDescription (text, entityLinks):
    text = CleanUpText (text)
    return ReplaceLinksInText (text, entityLinks)

def GenerateParameterTypesHtml (paramTypes, generator, entityLinks):
    for i in range (0, len (paramTypes)):
        paramType = paramTypes[i]
        paramTypeHtml = FinalizeType (paramType, entityLinks)
        generator.AddTagWithClass ('span', 'type parameter_type', paramTypeHtml)
        if (i < len (paramTypes) - 1):
            generator.AddTagWithClass ('span', 'parameter_type_separator', '|')

def GenerateParameterListHtml (parameters, generator, entityLinks):
    for param in parameters:
        generator.BeginTagWithClass ('div', 'parameter_header')
        generator.AddTagWithClass ('span', 'parameter_name', param.name)
        GenerateParameterTypesHtml (param.types, generator, entityLinks)
        if param.isOptional:
            generator.AddTagWithClass ('span', 'parameter_attributes', '(optional)')
        generator.EndTag ('div')
        generator.BeginTagWithClass ('div', 'parameter_main')
        generator.AddTagWithClass ('div', 'parameter_description', FinalizeDescription (param.description, entityLinks))
        if len (param.subParameters) > 0:
            GenerateParameterListHtml (param.subParameters, generator, entityLinks)
        generator.EndTag ('div')

class FunctionType (Enum):
    Constructor = 1
    ClassMethod = 2
    Standalone = 3

def GenerateFunctionHtml (function, generator, entityLinks, type):
    paramNames = map (lambda x : x.name, function.parameters)
    functionSignature = function.name + ' (' + ', '.join (paramNames) + ')'
    if type == FunctionType.Constructor:
        functionSignature = 'new ' + functionSignature
    generator.BeginTagWithClass ('div', 'function_container')
    generator.AddTagWithAttributes ('div', [('id', function.name), ('class', 'function_signature')], functionSignature)
    if function.description != None:
        generator.AddTagWithClass ('div', 'function_title', 'Description')
        generator.AddTagWithClass ('div', 'function_description', FinalizeDescription (function.description, entityLinks))
    if function.parameters != None and len (function.parameters) > 0:
        generator.AddTagWithClass ('div', 'function_title', 'Parameters')
        GenerateParameterListHtml (function.parameters, generator, entityLinks)
    if function.returns != None:
        generator.AddTagWithClass ('div', 'function_title', 'Returns')
        generator.BeginTagWithClass ('div', 'function_returns')
        if function.returns.types != None:
            GenerateParameterTypesHtml (function.returns.types, generator, entityLinks)
        if function.returns.description != None:
            generator.AddTagWithClass ('span', 'return_description', FinalizeDescription (function.returns.description, entityLinks))
        generator.EndTag ('div')
    generator.EndTag ('div')
