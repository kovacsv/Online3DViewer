let plugins = new Map ();

export const PluginType =
{
    Header : 1,
    Toolbar : 2
};

export function RegisterPlugin (type, plugin)
{
    if (!plugins.has (type)) {
        plugins.set (type, []);
    }
    let typedPlugins = plugins.get (type);
    typedPlugins.push (plugin);
}

export function EnumeratePlugins (type, onPlugin)
{
    if (!plugins.has (type)) {
        return;
    }
    let typedPlugins = plugins.get (type);
    for (let typedPlugin of typedPlugins) {
        onPlugin (typedPlugin);
    }
}
