import os
import shutil

from . import utils as Utils
from .html_generator import HtmlGenerator
from .doc_entities import PageType

class Documentation:
    def __init__ (self):
        self.pageGroups = []
        self.classes = []
        self.functions = []
        self.enums = []
        self.entityLinks = {}

    def AddPageGroup (self, pageGroup):
        for page in pageGroup.pages:
            self.AddEntityLink (page.name, page.GetLocation ())
        self.pageGroups.append (pageGroup)

    def AddClass (self, classDoc):
        self.AddEntityLink (classDoc.GetName (), classDoc.GetLocation ())
        self.classes.append (classDoc)

    def AddFunction (self, functionDoc):
        self.AddEntityLink (functionDoc.GetName (), functionDoc.GetLocation ())
        self.functions.append (functionDoc)

    def AddEnum (self, enumDoc):
        self.AddEntityLink (enumDoc.GetName (), enumDoc.GetLocation ())
        self.enums.append (enumDoc)

    def AddEntityLink (self, name, url):
        assert (not name in self.entityLinks)
        self.entityLinks[name] = url

def GenerateDocumentationPage (documentation, templatePath, resultDirPath, navigationHtml, entity, eol):
    resultPath = os.path.join (resultDirPath, entity.GetLocation ())
    shutil.copy (templatePath, resultPath)
    Utils.ReplaceStringsInFile (resultPath, [
        ('$$$TITLE$$$', entity.GetName ()),
        ('$$$NAVIGATION$$$', navigationHtml),
        ('$$$MAIN$$$', entity.GetHtml (documentation.entityLinks, eol))
    ])

def GenerateLinkHtml (entityName, entityLink):
    target = '_blank' if entityLink.startswith ('http') else '_self'
    return '<a href="{1}" target="{2}">{0}</a>'.format (entityName, entityLink, target)

def AddNavigationSection (generator, name, entities):
    generator.BeginTagWithClass ('div', 'navigation_section')
    generator.AddTagWithClass ('div', 'navigation_title', name)
    for entity in entities:
        linkHtml = GenerateLinkHtml (entity.GetName (), entity.GetLocation ())
        generator.AddTagWithAttributes ('div', [('id', 'nav-' + entity.GetName ()), ('class', 'navigation_item')], linkHtml)
    generator.EndTag ('div')

def GenerateNavigationHtml (documentation, eol):
    generator = HtmlGenerator (eol)
    for pageGroup in documentation.pageGroups:
        AddNavigationSection (generator, pageGroup.name, pageGroup.pages)
    AddNavigationSection (generator, 'Classes', sorted (documentation.classes, key = lambda x : x.name))
    AddNavigationSection (generator, 'Functions', sorted (documentation.functions, key = lambda x : x.name))
    AddNavigationSection (generator, 'Enums', sorted (documentation.enums, key = lambda x : x.name))
    return generator.GetHtml ()

def GenerateDocumentation (documentation, sourceFolder, targetFolder):
    templateHtmlPath = os.path.join (sourceFolder, 'Template.html')
    eol = Utils.GetEOLCharFromFile (templateHtmlPath)

    navigationHtml = GenerateNavigationHtml (documentation, eol)

    for pageGroup in documentation.pageGroups:
        for page in pageGroup.pages:
            if page.type == PageType.External:
                continue
            GenerateDocumentationPage (documentation, templateHtmlPath, targetFolder, navigationHtml, page, eol)

    allEntities = [
        documentation.classes,
        documentation.functions,
        documentation.enums
    ]
    for entityList in allEntities:
        for entity in entityList:
            GenerateDocumentationPage (documentation, templateHtmlPath, targetFolder, navigationHtml, entity, eol)
