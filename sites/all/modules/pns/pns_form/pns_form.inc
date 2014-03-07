<?php

function _load_node_form($buildType, $nodeType = NULL, $nid = NULL, $params = NULL) {
    global $user;
    module_load_include('inc', 'node', 'node.pages');

    switch($buildType) {
        case 'create' :
            if ($nodeType == NULL) {
                //set error message
                drupal_set_message($message = 'Can not find nodeType.', $type = 'error');
                return;
            }
            $node = new StdClass();
            $node -> uid = $user -> uid;
            $node -> type = $nodeType;
            $node -> language = 'und';
            node_object_prepare($node);
            break;
        case 'edit' :
            if ($nid == NULL) {
                //set error message
                drupal_set_message($message = 'Can not find nid for Node.', $type = 'error');
                return;
            }
            $node = node_load($nid);
            $nodeType = $node -> type;
            break;
        default :
            //set error message
            drupal_set_message($message = 'Can not find buildType.', $type = 'error');
            return;
            break;
    }

    $form_state = array();

    if (!empty($params)) {
        $paramKeys = array_keys($params);
        $paramValues = array_values($params);
        $numberOfParams = count($paramKeys);
        for ($i = 0; $i < $numberOfParams; $i++) {
            $form_state[$paramKeys[$i]] = $paramValues[$i];
        }
    }

    $form_state['build_info']['args'] = array($node);
    $formName = $nodeType . '_node_form';
    $form = drupal_build_form($formName, $form_state);

    $output = drupal_render($form);
    return $output;
}

function _load_node_form_without_render($buildType, $nodeType = NULL, $nid = NULL, $params = NULL) {
    global $user;
    module_load_include('inc', 'node', 'node.pages');

    switch($buildType) {
        case 'create' :
            if ($nodeType == NULL) {
                //set error message
                drupal_set_message($message = 'Can not find nodeType.', $type = 'error');
                return;
            }
            $node = new StdClass();
            $node -> uid = $user -> uid;
            $node -> type = $nodeType;
            $node -> language = 'und';

            node_object_prepare($node);
            break;
        case 'edit' :
            if ($nid == NULL) {
                //set error message
                drupal_set_message($message = 'Can not find nid for Node.', $type = 'error');
                return;
            }
            $node = node_load($nid);
            break;
        default :
            //set error message
            drupal_set_message($message = 'Can not find buildType.', $type = 'error');
            return;
            break;
    }

    $form_state = array();

    if (!empty($params)) {
        $paramKeys = array_keys($params);
        $paramValues = array_values($params);
        $numberOfParams = count($paramKeys);
        for ($i = 0; $i < $numberOfParams; $i++) {
            $form_state[$paramKeys[$i]] = $paramValues[$i];
        }
    }

    $form_state['build_info']['args'] = array($node);
    $formName = $nodeType . '_node_form';
    $form = drupal_build_form($formName, $form_state);

    return $form;
}
