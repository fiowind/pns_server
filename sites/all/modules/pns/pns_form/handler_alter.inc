<?php
// youngmin
function _unset_menu_items(&$form, $formId) {
	unset($form['menu']);
	unset($form['path']);
	unset($form['author']);
	unset($form['comment_settings']);
	unset($form['options']);
	unset($form['additional_settings']);
	unset($form['actions']['preview']);
	unset($form['revision_information']);

	$unsetDeleteButton = TRUE;
	// switch($formId) {
		
			
	// }
	if ($unsetDeleteButton)	unset($form['actions']['delete']);
}

function _disable_form_elements(&$form, $fields) {
	foreach ($fields as $field) {
		$command = '$form[\'' . $field . "']['und']['#disabled'] = TRUE;";
		eval($command);
	}
}

function _unset_form_elements(&$form, $fields) {
	foreach ($fields as $field) {
		$command = 'unset($form[\'' . $field . "']);";
		eval($command);
	}
}

function _hidden_form_elements(&$form, $fields) {
	foreach ($fields as $field) {
		$command = '$form[\'' . $field . "']['#type'] = 'hidden';";
		eval($command);
	}
}

function _add_ajax_submit_callback($form_id, &$form) {
	$change = FALSE;
	$changeEachRow = FALSE;

	// switch($form_id) {
	// 	case 'views_form_list_treenodecounterforvoucher_panel_pane_1' :
	// 		$changeEachRow = TRUE;
	// 		break;
	// 	case 'vouchercardtype_node_form' :
	// 	case 'unittransfer_node_form' :
	// 		if (isset($form['nid']['#value'])) {// edit
	// 			$change = TRUE;
	// 		}
	// 		break;		
	// }

	if ($change) {
		unset($form['actions']['submit']['#submit']);
		unset($form['actions']['delete']['#submit']);
		unset($form['#validate']);
		unset($form['#action']);
		$form['actions']['submit']['#id'] = 'submit-in-ajax-callback';
		$form['actions']['delete']['#id'] = 'delete-in-ajax-callback';
		$form['#prefix'] = '<div id="form_content">';
		$form['#suffix'] = '</div>';
		$form['actions']['submit']['#ajax'] = array('wrapper' => 'form_content', 'callback' => 'edit_pane_callback', 'method' => 'replace', 'effect' => 'fade', );
		$form['actions']['delete']['#ajax'] = array('wrapper' => 'form_content', 'callback' => 'delete_pane_callback', 'method' => 'replace', 'effect' => 'fade', );
	}
}

function delete_pane_callback($form, &$form_state) {
	ctools_include('node.pages', 'node', '');
	ctools_include('ajax');
	
	$newNode = node_load($form['nid']['#value']);
	$form_state['values']['changed'] = $newNode -> changed;

	node_form_validate($form, $form_state);
	
	if (!empty($form_state['values']['field_negative'])) {
		if ($form_state['values']['field_negative']['und'][0]['value'] == 1) {
			$form_state['values']['field_rating_operation']['und'][0]['tid'] = 84;
			// Rating Operation = notin
		} else {
			$form_state['values']['field_rating_operation']['und'][0]['tid'] = 81;
			// Rating Operation = is equal to
		}
	}

	if (!form_get_errors()) {
		$url = _get_redirect_url_in_delete($newNode);
		$path =  $url['path'] . '#'. $url['fragment'];
		$output[] = ctools_ajax_command_redirect($path);
		node_delete($newNode->nid);
		print ajax_render($output);
		exit;
	}else{
		$form_state['rebuild'] = TRUE;
		return $form;
	}
}

function edit_pane_callback($form, &$form_state) {

	$newNode = node_load($form['nid']['#value']);
	$form_state['values']['changed'] = $newNode -> changed;

	node_form_validate($form, $form_state);
	
	if (!empty($form_state['values']['field_negative'])) {
		if ($form_state['values']['field_negative']['und'][0]['value'] == 1) {
			$form_state['values']['field_rating_operation']['und'][0]['tid'] = 84;
			// Rating Operation = notin
		} else {
			$form_state['values']['field_rating_operation']['und'][0]['tid'] = 81;
			// Rating Operation = is equal to
		}
	}

	if (!form_get_errors()) {
		node_form_submit($form, $form_state);
		//error_log('node_form_submit');
		if (isset($form_state['ajax_actions'])) {
			foreach ($form_state['ajax_actions'] as $functionName) {
				$evalString = $functionName . '($form, $form_state);';
				eval($evalString);
			}
		}
	}
	$form_state['rebuild'] = TRUE;
	return $form;
}

function pns_form_form_alter(&$form, &$form_state, $form_id) {
	// load_required_js_css_before_ajax_load();
	if ((isset($form['#attributes']) && isset($form['#attributes']['class'])) && gettype($form['#attributes']['class']) == 'array') {
		$form['#attributes']['class'][] = 'myform';
	}
	
	switch($form_id) {		
		case 'campaign_node_form':
			unset($form['field_total_app_client_count']);
			_unset_menu_items($form, $form_id);
			break;	
		case 'application_node_form':
		case 'target_node_form':
			_unset_menu_items($form, $form_id);
			break;
		case 'message_node_form':
			_unset_menu_items($form, $form_id);

			unset($form['field_indicator_preview']);
			$form['field_indicator_preview']['#markup'] = theme('indicator_preview',array('form' => $form));
			$form['field_indicator_preview']['#weight'] = 0;

			unset($form['field_popup_preview']);
			$form['field_popup_preview']['#markup'] = theme('popup_preview',array('form' => $form));
			$form['field_popup_preview']['#weight'] = 1;

			break;	
		case 'rich_message_node_form':
			_unset_menu_items($form, $form_id);
			
			$form['#attached']['js'] = array(
				libraries_get_path('ckeditor').'/ckeditor.js',
				libraries_get_path('ckeditor').'/config.js',
				drupal_get_path('module', 'pns_layout') . '/js/pns_layout.js'
			);
			break;
	}
	_add_ajax_submit_callback($form_id, $form);
	return $form;
}
