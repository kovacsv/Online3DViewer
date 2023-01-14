import os
import sys
import shutil
import zipfile
import json
import subprocess
import platform
import html
import re

from lib.doc_entities import PageType, PageGroup, PageDoc, EnumMemberDoc, EnumDoc, ParameterDoc, ReturnsDoc, FunctionDoc, ClassDoc
from lib.doc_generator import Documentation, GenerateDocumentation

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
        return parameters
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

def AddPageGroupsToDocumentation (documentation, pageGroups, sourcesFolder):
    for pageGroup in pageGroups:
        pageGroupDoc = PageGroup (pageGroup['name'])
        for page in pageGroup['pages']:
            pageType = PageType.External if page['url'].startswith ('http') else PageType.Internal
            pageDoc = PageDoc (page['name'], page['url'], sourcesFolder, pageType)
            pageGroupDoc.AddPage (pageDoc)
        documentation.AddPageGroup (pageGroupDoc)

def AddEntitiesToDocumentation (documentation, doclets):
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
            constructorDoc = FunctionDoc (name, description, parameters, returns)
            classDoc.SetConstructor (constructorDoc)
            documentation.AddClass (classDoc)
            classNameToDoc[name] = classDoc
        elif kind == 'function':
            if 'memberof' in doclet:
                parentName = doclet['memberof']
                if parentName in classNameToDoc:
                    classDoc = classNameToDoc[parentName]
                    functionDoc = FunctionDoc (name, description, parameters, returns)
                    classDoc.AddFunction (functionDoc)
            else:
                functionDoc = FunctionDoc (name, description, parameters, returns)
                documentation.AddFunction (functionDoc)
        elif kind == 'constant':
            if 'isEnum' in doclet and doclet['isEnum'] == True:
                enumDoc = EnumDoc (name, description)
                documentation.AddEnum (enumDoc)
                enumNameToDoc[name] = enumDoc
        elif kind == 'member':
            parentName = doclet['memberof']
            if parentName in enumNameToDoc:
                enumDoc = enumNameToDoc[parentName]
                memberDoc = EnumMemberDoc (name, description)
                enumDoc.AddMember (memberDoc)

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

    for fileName in os.listdir (resultDir):
        filePath = os.path.join (resultDir, fileName)
        if not os.path.isdir (filePath):
            os.remove (filePath)

    config = None
    with open (os.path.join (sourceDir, 'config.json')) as configJson:
        config = json.load (configJson)

    documentation = Documentation ()

    pageGroups = config['page_groups']
    AddPageGroupsToDocumentation (documentation, pageGroups, sourceDir)

    doclets = GetDocumentedDoclets (resultJson)
    AddEntitiesToDocumentation (documentation, doclets)
    for name in config['external_refs']:
        documentation.AddEntityLink (name, config['external_refs'][name])

    GenerateDocumentation (documentation, sourceDir, resultDir)
    return 0

sys.exit (Main (sys.argv))
