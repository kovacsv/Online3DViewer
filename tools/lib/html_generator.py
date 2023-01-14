class HtmlGenerator:
    def __init__ (self, eol):
        self.html = ''
        self.eol = eol

    def AddText (self, content):
        self.html += content

    def AddLine (self, content):
        self.AddText (content + self.eol)

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
