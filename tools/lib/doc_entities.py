import os
from enum import Enum

from . import utils as Utils
from .html_generator import HtmlGenerator
from .doc_utils import ReplaceLinksInText, FinalizeDescription, FunctionType, GenerateFunctionHtml

class DocEntity:
    def GetName (self):
        raise Exception ('Not implemented.')

    def GetLocation (self):
        raise Exception ('Not implemented.')

    def GetHtml (self, entityLinks, eol):
        raise Exception ('Not implemented.')

class PageGroup:
    def __init__ (self, name):
        self.name = name
        self.pages = []

    def AddPage (self, page):
        self.pages.append (page)

class PageType (Enum):
    Internal = 1
    External = 2

class PageDoc (DocEntity):
    def __init__ (self, name, link, folder, type):
        self.name = name
        self.link = link
        self.folder = folder
        self.type = type

    def GetName (self):
        return self.name

    def GetLocation (self):
        if self.type == PageType.Internal:
            prefix = 'Page_' if self.link != 'index.html' else ''
            return prefix + self.link
        else:
            return self.link

    def GetHtml (self, entityLinks, eol):
        if self.type == PageType.Internal:
            pageContent = Utils.GetFileContent (os.path.join (self.folder, self.link))
            return '<div class="page">' + eol + ReplaceLinksInText (pageContent, entityLinks) + eol + '</div>'
        else:
            raise Exception ('GetHtml called for external link.')

class EnumMemberDoc:
    def __init__ (self, name, description):
        self.name = name
        self.description = description

class EnumDoc (DocEntity):
    def __init__ (self, name, description):
        self.name = name
        self.description = description
        self.members = []

    def AddMember (self, member):
        self.members.append (member)

    def GetName (self):
        return self.name

    def GetLocation (self):
        return 'Enum_' + self.name + '.html'

    def GetHtml (self, entityLinks, eol):
        generator = HtmlGenerator (eol)
        generator.AddTag ('h1', self.name)
        generator.AddTagWithClass ('div', 'description', FinalizeDescription (self.description, entityLinks))
        if len (self.members) > 0:
            generator.AddTag ('h2', 'Values')
            for member in self.members:
                generator.BeginTagWithClass ('div', 'parameter_header')
                generator.AddTagWithClass ('span', 'parameter_name', member.name)
                generator.EndTag ('div')
                generator.BeginTagWithClass ('div', 'parameter_main')
                generator.AddTagWithClass ('div', 'parameter_description', FinalizeDescription (member.description, entityLinks))
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

class FunctionDoc (DocEntity):
    def __init__ (self, name, description, parameters, returns):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.returns = returns

    def AddParameter (self, parameter):
        self.parameters.append (parameter)

    def GetName (self):
        return self.name

    def GetLocation (self):
        return 'Function_' + self.name + '.html'

    def GetHtml (self, navigation, eol):
        generator = HtmlGenerator (eol)
        generator.AddTag ('h1', self.name)
        GenerateFunctionHtml (self, generator, navigation, FunctionType.Standalone)
        return generator.GetHtml ()

class ClassDoc (DocEntity):
    def __init__ (self, name, description):
        self.name = name
        self.description = description
        self.constructor = None
        self.functions = []

    def SetConstructor (self, constructor):
        self.constructor = constructor

    def AddFunction (self, function):
        self.functions.append (function)

    def GetName (self):
        return self.name

    def GetLocation (self):
        return 'Class_' + self.name + '.html'

    def GetHtml (self, entityLinks, eol):
        generator = HtmlGenerator (eol)
        generator.AddTag ('h1', self.name)
        generator.AddTagWithClass ('div', 'description', FinalizeDescription (self.description, entityLinks))
        if self.constructor != None:
            generator.AddTag ('h2', 'Constructor')
            GenerateFunctionHtml (self.constructor, generator, entityLinks, FunctionType.Constructor)
        if len (self.functions) > 0:
           generator.AddTag ('h2', 'Methods')
           for function in self.functions:
               GenerateFunctionHtml (function, generator, entityLinks, FunctionType.Standalone.ClassMethod)
        return generator.GetHtml ()
