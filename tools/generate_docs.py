import os
import sys
import shutil
import zipfile
import json
import subprocess
import platform
import html
import re

from lib import tools_lib as Tools

class HtmlGenerator:
    def __init__ (self):
        self.html = ''

    def AddText (self, content):
        self.html += content

    def AddLine (self, content):
        self.AddText (content + '\n')

    def AddTag (self, tagName, content):
        self.AddLine ('<{0}>{1}</{0}>'.format (tagName, content))

    def AddTagWithClass (self, tagName, className, content):
        self.AddLine ('<{0} class="{1}">{2}</{0}>'.format (tagName, className, content))

    def AddTagWithAttributes (self, tagName, attributes, content):
        line = '<{0}'.format (tagName);
        if len (attributes) > 0:
            attributeStrings = map (lambda x : '{0}="{1}"'.format (x[0], x[1]), attributes)
            line += ' ' + ' '.join (attributeStrings)
        line += '>{1}</{0}>'.format (tagName, content)
        self.AddLine (line)

    def BeginTag (self, tagName):
        self.AddLine ('<{0}>'.format (tagName))

    def BeginTagWithClass (self, tagName, className):
        self.AddLine ('<{0} class="{1}">'.format (tagName, className))

    def EndTag (self, tagName):
        self.AddLine ('</{0}>'.format (tagName))

    def GetHtml (self):
        return self.html

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

def FinalizeDescription (text, entityLinks):
    text = CleanUpText (text)
    links = re.findall ('{@link (.+)}', text)
    for link in links:
        if link in entityLinks:
            text = text.replace ('{@link ' + link + '}', GenerateLink (link, entityLinks[link]))
        else:
            text = text.replace ('{@link ' + link + '}', link)
    return text

class NavigationGroup:
    def __init__ (self, name, sort):
        self.name = name
        self.sort = sort
        self.links = []

    def AddLink (self, name, url):
        self.links.append ({
            'name' : name,
            'url' : url
        })

class Navigation:
    def __init__ (self):
        self.groups = []
        self.entityLinks = {}

    def AddGroup (self, group):
        self.groups.append (group)

    def AddEntityLink (self, name, url):
        self.entityLinks[name] = url

    def GenerateHtml (self):
        generator = HtmlGenerator ()
        for group in self.groups:
            if len (group.links) == 0:
                continue
            generator.BeginTagWithClass ('div', 'navigation_section')
            generator.AddTagWithClass ('div', 'navigation_title', group.name)
            finalLinks = group.links
            if group.sort:
                finalLinks = sorted (group.links, key = lambda x : x['name'])
            for link in finalLinks:
                linkHtml = GenerateLink (link['name'], link['url'])
                generator.AddTagWithAttributes ('div', [('id', 'nav-' + link['name']), ('class', 'navigation_item')], linkHtml)
            generator.EndTag ('div')
        return generator.GetHtml ()

class EnumMemberDoc:
    def __init__ (self, name, description):
        self.name = name
        self.description = description

class EnumDoc:
    def __init__ (self, name, description):
        self.name = name
        self.description = description
        self.members = []

    def AddMember (self, member):
        self.members.append (member)

    def GenerateHtml (self, navigation):
        generator = HtmlGenerator ()
        generator.AddTag ('h1', self.name)
        generator.AddTagWithClass ('div', 'description', FinalizeDescription (self.description, navigation.entityLinks))
        if len (self.members) > 0:
            generator.AddTag ('h2', 'Values')
            for member in self.members:
                generator.BeginTagWithClass ('div', 'parameter_header')
                generator.AddTagWithClass ('span', 'parameter_name', member.name)
                generator.EndTag ('div')
                generator.BeginTagWithClass ('div', 'parameter_main')
                generator.AddTagWithClass ('div', 'parameter_description', FinalizeDescription (member.description, navigation.entityLinks))
                generator.EndTag ('div')

        return generator.GetHtml ()

class ParameterDoc:
    def __init__ (self, name, types, isOptional, description):
        self.name = name
        self.types = types
        self.isOptional = isOptional
        self.description = description
        self.subParameters = []

    def AddSubParameter (self, parameter):
        self.subParameters.append (parameter)

class ReturnsDoc:
    def __init__ (self, types, description):
        self.types = types
        self.description = description

class MethodDoc:
    def __init__ (self, name, description, parameters, returns):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.returns = returns

    def AddParameter (self, parameter):
        self.parameters.append (parameter)

    def GenerateHtml (self, navigation):
        generator = HtmlGenerator ()
        generator.AddTag ('h1', self.name)
        GenerateMethodHtml (self, generator, navigation, False)
        return generator.GetHtml ()

class ClassDoc:
    def __init__ (self, name, description):
        self.name = name
        self.description = description
        self.constructor = None
        self.methods = []

    def SetConstructor (self, constructor):
        self.constructor = constructor

    def AddMethod (self, method):
        self.methods.append (method)

    def GenerateHtml (self, navigation):
        generator = HtmlGenerator ()
        generator.AddTag ('h1', self.name)
        generator.AddTagWithClass ('div', 'description', FinalizeDescription (self.description, navigation.entityLinks))
        if self.constructor != None:
            generator.AddTag ('h2', 'Constructor')
            GenerateMethodHtml (self.constructor, generator, navigation, True)
        if len (self.methods) > 0:
           generator.AddTag ('h2', 'Methods')
           for method in self.methods:
               GenerateMethodHtml (method, generator, navigation, False)
        return generator.GetHtml ()

def GenerateParameterListHtml (parameters, generator, navigation):
    for param in parameters:
        generator.BeginTagWithClass ('div', 'parameter_header')
        generator.AddTagWithClass ('span', 'parameter_name', param.name)
        typeNames = map (lambda x : FinalizeType (x, navigation.entityLinks), param.types)
        generator.AddTagWithClass ('span', 'type parameter_type', ', '.join (typeNames))
        if param.isOptional:
            generator.AddTagWithClass ('span', 'parameter_attributes', '(optional)')
        generator.EndTag ('div')
        generator.BeginTagWithClass ('div', 'parameter_main')
        generator.AddTagWithClass ('div', 'parameter_description', FinalizeDescription (param.description, navigation.entityLinks))
        if len (param.subParameters) > 0:
            GenerateParameterListHtml (param.subParameters, generator, navigation)
        generator.EndTag ('div')

def GenerateMethodHtml (method, generator, navigation, isConstructor):
    paramNames = map (lambda x : x.name, method.parameters)
    methodSignature = method.name + ' (' + ', '.join (paramNames) + ')'
    if isConstructor:
        methodSignature = 'new ' + methodSignature
    generator.BeginTagWithClass ('div', 'method_container')
    generator.AddTagWithAttributes ('div', [('id', method.name), ('class', 'method_signature')], methodSignature)
    if method.description != None:
        generator.AddTagWithClass ('div', 'method_title', 'Description')
        generator.AddTagWithClass ('div', 'method_description', FinalizeDescription (method.description, navigation.entityLinks))
    if method.parameters != None and len (method.parameters) > 0:
        generator.AddTagWithClass ('div', 'method_title', 'Parameters')
        GenerateParameterListHtml (method.parameters, generator, navigation)
    if method.returns != None:
        generator.AddTagWithClass ('div', 'method_title', 'Returns')
        generator.BeginTagWithClass ('div', 'method_returns')
        if method.returns.types != None:
            typeNames = map (lambda x : FinalizeType (x, navigation.entityLinks), method.returns.types)
            generator.AddTagWithClass ('span', 'type return_type', ', '.join (typeNames))
        if method.returns.description != None:
            generator.AddTagWithClass ('span', 'return_description', FinalizeDescription (method.returns.description, navigation.entityLinks))
        generator.EndTag ('div')
    generator.EndTag ('div')

def GetDictValue (dict, key):
    if not key in dict:
        return None
    return dict[key]

def GetDocumentedDoclets (doclets):
    documented = []
    for doclet in doclets:
        kind = doclet['kind']
        if kind not in ['class', 'function', 'constant', 'member']:
            continue
        if 'undocumented' in doclet and doclet['undocumented'] == True:
            continue
        documented.append (doclet)
    return documented

def GetParametersFromDoclet (doclet):
    parameters = []
    paramNamespaceToDoc = {}
    if not 'params' in doclet:
        return None
    for param in doclet['params']:
        paramName = GetDictValue (param, 'name')
        paramIsOptional = 'optional' in param and param['optional'] == True
        paramNameParts = paramName.split ('.')
        paramTypes = None
        if 'type' in param:
            paramTypes = param['type']['names']
        if len (paramNameParts) == 1:
            paramDoc = ParameterDoc (
                paramName,
                paramTypes,
                paramIsOptional,
                GetDictValue (param, 'description')
            )
            parameters.append (paramDoc)
            paramNamespaceToDoc[paramName] = paramDoc
        else:
            paramDoc = ParameterDoc (
                paramNameParts[len (paramNameParts) - 1],
                paramTypes,
                paramIsOptional,
                GetDictValue (param, 'description')
            )
            paramNamespace = '.'.join (paramNameParts[0:-1])
            paramNamespaceToDoc[paramNamespace].AddSubParameter (paramDoc)
            paramNamespaceToDoc[paramName] = paramDoc
    return parameters

def GetReturnsFromDoclet (doclet):
    if not 'returns' in doclet:
        return None
    assert (len (doclet['returns']) == 1)
    returns = doclet['returns'][0]
    returnType = None
    if 'type' in returns:
        returnType = returns['type']['names']
    return ReturnsDoc (
        returnType,
        GetDictValue (returns, 'description')
    )

def BuildHierarchy (doclets):
    hierarchy = {
        'classes' : [],
        'functions' : [],
        'enums' : []
    }
    classNameToDoc = {}
    enumNameToDoc = {}
    for doclet in doclets:
        kind = doclet['kind']
        name = doclet['name']
        parameters = GetParametersFromDoclet (doclet)
        returns = GetReturnsFromDoclet (doclet)
        description = GetDictValue (doclet, 'description')
        if kind == 'class':
            classDoc = ClassDoc (name, doclet['classdesc'])
            constructorDoc = MethodDoc (name, description, parameters, returns)
            classDoc.SetConstructor (constructorDoc)
            hierarchy['classes'].append (classDoc)
            classNameToDoc[name] = classDoc
        elif kind == 'function':
            if 'memberof' in doclet:
                parentName = doclet['memberof']
                if parentName in classNameToDoc:
                    classDoc = classNameToDoc[parentName]
                    methodDoc = MethodDoc (name, description, parameters, returns)
                    classDoc.AddMethod (methodDoc)
            else:
                methodDoc = MethodDoc (name, description, parameters, returns)
                hierarchy['functions'].append (methodDoc)
        elif kind == 'constant':
            if 'isEnum' in doclet and doclet['isEnum'] == True:
                enumDoc = EnumDoc (name, description)
                hierarchy['enums'].append (enumDoc)
                enumNameToDoc[name] = enumDoc
        elif kind == 'member':
            parentName = doclet['memberof']
            if parentName in enumNameToDoc:
                enumDoc = enumNameToDoc[parentName]
                memberDoc = EnumMemberDoc (name, description)
                enumDoc.AddMember (memberDoc)
    return hierarchy

def CreateFromTemplate (templateHtmlPath, resultHtmlPath, navigation, title, content):
    shutil.copy (templateHtmlPath, resultHtmlPath)
    Tools.ReplaceStringsInFile (resultHtmlPath, [
        ('$$$TITLE$$$', title),
        ('$$$NAVIGATION$$$', navigation.GenerateHtml ()),
        ('$$$MAIN$$$', content),
        ('\r\n', '\n')
    ])

def BuildNavigation (pageGroups, hierarchy):
    navigation = Navigation ()

    for pageGroup in pageGroups:
        navGroup = NavigationGroup (pageGroup['name'], False)
        for page in pageGroup['pages']:
            navGroup.AddLink (page['name'], page['url'])
        navigation.AddGroup (navGroup)

    classesGroup = NavigationGroup ('Classes', True)
    for classDoc in hierarchy['classes']:
        navigation.AddEntityLink (classDoc.name, classDoc.name + '.html')
        classesGroup.AddLink (classDoc.name, classDoc.name + '.html')
    navigation.AddGroup (classesGroup)

    functionsGroup = NavigationGroup ('Functions', True)
    for methodDoc in hierarchy['functions']:
        navigation.AddEntityLink (methodDoc.name, methodDoc.name + '.html')
        functionsGroup.AddLink (methodDoc.name, methodDoc.name + '.html')
    navigation.AddGroup (functionsGroup)

    enumsGroup = NavigationGroup ('Enums', True)
    for enumDoc in hierarchy['enums']:
        navigation.AddEntityLink (enumDoc.name, enumDoc.name + '.html')
        enumsGroup.AddLink (enumDoc.name, enumDoc.name + '.html')
    navigation.AddGroup (enumsGroup)

    return navigation

def BuildDocumentationFiles (navigation, pageGroups, hierarchy, sourceDir, resultDir):
    templateHtmlPath = os.path.join (sourceDir, 'Template.html')

    for pageGroup in pageGroups:
        for page in pageGroup['pages']:
            if page['url'].startswith ('http'):
                continue
            sourceHtmlPath = os.path.join (sourceDir, page['url'])
            pageHtmlPath = os.path.join (resultDir, page['url'])
            pageContent = '<div class="page">\n' + Tools.GetFileContent (sourceHtmlPath) + '\n</div>'
            CreateFromTemplate (templateHtmlPath, pageHtmlPath, navigation, page['name'], pageContent)

    for classDoc in hierarchy['classes']:
        classHtmlPath = os.path.join (resultDir, classDoc.name + '.html')
        CreateFromTemplate (templateHtmlPath, classHtmlPath, navigation, classDoc.name, classDoc.GenerateHtml (navigation))

    for methodDoc in hierarchy['functions']:
        methodHtmlPath = os.path.join (resultDir, methodDoc.name + '.html')
        CreateFromTemplate (templateHtmlPath, methodHtmlPath, navigation, methodDoc.name, methodDoc.GenerateHtml (navigation))

    for enumDoc in hierarchy['enums']:
        enumHtmlPath = os.path.join (resultDir, enumDoc.name + '.html')
        CreateFromTemplate (templateHtmlPath, enumHtmlPath, navigation, enumDoc.name, enumDoc.GenerateHtml (navigation))

def Main (argv):
    toolsDir = os.path.dirname (os.path.abspath (__file__))
    rootDir = os.path.dirname (toolsDir)
    os.chdir (rootDir)

    shell = True
    if platform.system () != 'Windows':
        shell = False
    result = subprocess.run (['jsdoc', '-c', 'tools/jsdoc.json'], stdout = subprocess.PIPE, shell = shell)
    resultJson = json.loads (result.stdout)

    resultDir = os.path.join (rootDir, 'docs')
    sourceDir = os.path.join (resultDir, 'source')

    config = None
    with open (os.path.join (sourceDir, 'config.json')) as configJson:
        config = json.load (configJson)

    doclets = GetDocumentedDoclets (resultJson)
    pageGroups = config['page_groups']
    hierarchy = BuildHierarchy (doclets)

    navigation = BuildNavigation (pageGroups, hierarchy)
    for name in config['external_refs']:
        navigation.AddEntityLink (name, config['external_refs'][name])

    BuildDocumentationFiles (navigation, pageGroups, hierarchy, sourceDir, resultDir)

    return 0

sys.exit (Main (sys.argv))
