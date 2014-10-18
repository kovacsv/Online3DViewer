<?php

$dir = dirname (__FILE__);
$dirbasename = basename ($dir);

$wgExtensionCredits['viewer3d'][] = array(
    'path' => __FILE__,
    'name' => 'Viewer3D',
    'author' => 'Viktor Kovacs', 
    'url' => 'https://www.mediawiki.org/wiki/Extension:Viewer3D', 
    'description' => 'With this extension you can view 3D models with WebGL.',
    'version'  => 0.1,
    'license-name' => "MIT"
);

$wgAutoloadClasses['Viewer3DHooks'] = $dir.'/Viewer3D.hooks.php';
$wgHooks['ParserFirstCallInit'][] = 'Viewer3DHooks::OnParserFirstCallInit';

$wgResourceModules['ext.Viewer3D'] = array(
	'scripts' => array ('three.min.js', 'jsmodeler.js', 'online3dembedder.js', 'Viewer3D.js'),
	'localBasePath' => $dir,
	'remoteExtPath' => 'Viewer3D'
);

?>
