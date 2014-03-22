<?php

function is_included_special_char($title) {
	if (strpos($title, ',') 
		|| strpos($title, '\'' ) ) {
		return TRUE;
	} 
	return FALSE;
}

function is_machine_name($argStr) {
	// if (preg_match('/[^0-9a-zA-Z_]/', $argStr)) {
	if (preg_match('/[^0-9a-zA-Z_]/', $argStr)) {
		return FALSE;
	}
	return TRUE;
}

function is_empty_string($str){
	if (strlen(trim($str)) == 0) return TRUE;
	else FALSE;
}

function is_macaddress($val) {
	return (bool)preg_match('/^([0-9a-fA-F][0-9a-fA-F]:){2}([0-9a-fA-F][0-9a-fA-F])$/', $val);
}

function _clone_vocabulary($baseVocaName, $targetVocaName, $param = array()) {
	$baseVocaMachineName = strtolower($baseVocaName);
	$baseVoca = taxonomy_vocabulary_machine_name_load($baseVocaMachineName);

	$targetVocaMachineName = strtolower($targetVocaName);
	$targetVoca = taxonomy_vocabulary_machine_name_load($targetVocaMachineName);

	//check target vocabulary
	if ($targetVoca == NULL) {
		$targetVoca = clone $baseVoca;
		unset($targetVoca -> vid);
		$targetVoca -> name = $targetVocaName;
		$targetVoca -> description = $targetVocaName;
		$targetVoca -> machine_name = $targetVocaMachineName;
		taxonomy_vocabulary_save($targetVoca);
	} else {
		$deleteTerms = taxonomy_get_tree($targetVoca -> vid);
		foreach ($deleteTerms as $deletTerm) {
			taxonomy_term_delete($deletTerm -> tid);
		}
	}

	//field instance information
	$fieldParam = array();
	$fieldParam['bundle'] = $baseVocaMachineName;
	$fieldInstances = field_read_instances($fieldParam);

	foreach ($fieldInstances as $field) {
		$checkParam = array();
		$checkParam['bundle'] = $targetVocaMachineName;
		$checkParam['field_name'] = $field['field_name'];
		$checkFieldInfo = field_read_instances($checkParam);

		if (empty($checkFieldInfo)) {
			$field_instance = array('field_name' => $field['field_name'], 'entity_type' => 'taxonomy_term', 'bundle' => $targetVocaMachineName, 'label' => $field['label'], 'description' => $field['description'], 'widget' => $field['widget'], );
			field_create_instance($field_instance);
		}
	}

	//get base terms
	$terms = taxonomy_get_tree($baseVoca -> vid);
	$tids = array();
	foreach ($terms as $term) {
		$tids[] = $term -> tid;
	}
	$baseTerms = taxonomy_term_load_multiple($tids);
	$tidMap = array();

	//duplicates terms
	foreach ($baseTerms as $baseTerm) {
		$targetTerm = clone $baseTerm;
		$targetTerm -> vid = $targetVoca -> vid;
		unset($targetTerm -> tid);

		$tempParent = taxonomy_get_parents($baseTerm -> tid);
		if (!empty($tempParent)) {
			$targetTerm -> parent = $tidMap[current($tempParent) -> tid];
		}

		//check rel_type params
		if (isset($param['rel_type']) && isset($targetTerm -> field_rel_type['und'][0]['value'])) {
			$baseRelTypeStr = $targetTerm -> field_rel_type['und'][0]['value'];
			$baseRelTypeArr = explode('_', $baseRelTypeStr);

			$reltypes = array('mobile', 'iptv', 'satellite', 'broadband', 'bundle', 'voip', 'cross');

			$matched = array_intersect($reltypes, $baseRelTypeArr);

			$newRelTypeStr = str_replace($matched, $param['rel_type'], $baseRelTypeStr);
			$targetTerm -> field_rel_type['und'][0]['value'] = $newRelTypeStr;
			$targetTerm -> field_rel_type['und'][0]['safe_value'] = $newRelTypeStr;
		}

		taxonomy_term_save($targetTerm);
		$tidMap[$baseTerm -> tid] = $targetTerm -> tid;

		$targetTerm = taxonomy_term_load($targetTerm -> tid);
		//field_collection items
		//field_qtabs_loading
		if (isset($baseTerm -> field_qtabs_loading['und'][0]['value'])) {
			unset($targetTerm -> field_qtabs_loading);
			$baseCollectionInfo = field_collection_item_load($baseTerm -> field_qtabs_loading['und'][0]['value']);
			$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_qtabs_loading'));
			$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
			$targetCollectionInfo -> field_tab_type = $baseCollectionInfo -> field_tab_type;
			$targetCollectionInfo -> field_tab_content = $baseCollectionInfo -> field_tab_content;
			$targetCollectionInfo -> field_view_display = $baseCollectionInfo -> field_view_display;
			$targetCollectionInfo -> field_view_arguments = $baseCollectionInfo -> field_view_arguments;
			$targetCollectionInfo -> save();
			$targetTerm -> field_qtabs_loading['und'][0]['value'] = $targetCollectionInfo -> item_id;
		}
		//field_qtabs_click
		if (isset($baseTerm -> field_qtabs_click['und'][0]['value'])) {
			unset($targetTerm -> field_qtabs_click);
			$baseCollectionInfo = field_collection_item_load($baseTerm -> field_qtabs_click['und'][0]['value']);
			$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_qtabs_click'));
			$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
			$targetCollectionInfo -> field_tab_type = $baseCollectionInfo -> field_tab_type;
			$targetCollectionInfo -> field_tab_content = $baseCollectionInfo -> field_tab_content;
			$targetCollectionInfo -> field_view_display = $baseCollectionInfo -> field_view_display;
			$targetCollectionInfo -> field_view_arguments = $baseCollectionInfo -> field_view_arguments;
			$targetCollectionInfo -> field_tab_title = $baseCollectionInfo -> field_tab_title;
			$targetCollectionInfo -> save();
			$targetTerm -> field_qtabs_click['und'][0]['value'] = $targetCollectionInfo -> item_id;
		}
		//field_qtabs_right_click
		if (isset($baseTerm -> field_qtabs_right_click['und'][0]['value'])) {
			unset($targetTerm -> field_qtabs_right_click);
			$baseCollectionInfo = field_collection_item_load($baseTerm -> field_qtabs_right_click['und'][0]['value']);
			$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_qtabs_right_click'));
			$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
			$targetCollectionInfo -> field_tab_type = $baseCollectionInfo -> field_tab_type;
			$targetCollectionInfo -> field_tab_content = $baseCollectionInfo -> field_tab_content;
			$targetCollectionInfo -> field_view_display = $baseCollectionInfo -> field_view_display;
			$targetCollectionInfo -> field_view_arguments = $baseCollectionInfo -> field_view_arguments;
			$targetCollectionInfo -> field_tab_title = $baseCollectionInfo -> field_tab_title;
			$targetCollectionInfo -> save();
			$targetTerm -> field_qtabs_right_click['und'][0]['value'] = $targetCollectionInfo -> item_id;
		}
		//field_qtabs_right_click_exclude
		if (isset($baseTerm -> field_qtabs_right_click_exclude['und'][0]['value'])) {
			unset($targetTerm -> field_qtabs_right_click_exclude);
			$baseCollectionInfo = field_collection_item_load($baseTerm -> field_qtabs_right_click_exclude['und'][0]['value']);
			$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_qtabs_right_click_exclude'));
			$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
			$targetCollectionInfo -> field_tab_type = $baseCollectionInfo -> field_tab_type;
			$targetCollectionInfo -> field_tab_content = $baseCollectionInfo -> field_tab_content;
			$targetCollectionInfo -> field_view_display = $baseCollectionInfo -> field_view_display;
			$targetCollectionInfo -> field_view_arguments = $baseCollectionInfo -> field_view_arguments;
			$targetCollectionInfo -> save();
			$targetTerm -> field_qtabs_right_click_exclude['und'][0]['value'] = $targetCollectionInfo -> item_id;
		}
		//field_qtabs_right_click_include
		if (isset($baseTerm -> field_qtabs_right_click_include['und'][0]['value'])) {
			unset($targetTerm -> field_qtabs_right_click_include);
			$baseCollectionInfo = field_collection_item_load($baseTerm -> field_qtabs_right_click_include['und'][0]['value']);
			$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_qtabs_right_click_include'));
			$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
			$targetCollectionInfo -> field_tab_type = $baseCollectionInfo -> field_tab_type;
			$targetCollectionInfo -> field_tab_content = $baseCollectionInfo -> field_tab_content;
			$targetCollectionInfo -> field_view_display = $baseCollectionInfo -> field_view_display;
			$targetCollectionInfo -> field_view_arguments = $baseCollectionInfo -> field_view_arguments;
			$targetCollectionInfo -> save();
			$targetTerm -> field_qtabs_right_click_include['und'][0]['value'] = $targetCollectionInfo -> item_id;
		}
		//field_qtabs_click_arguments
		if (isset($baseTerm -> field_qtabs_click_arguments['und'][0]['value'])) {
			unset($targetTerm -> field_qtabs_click_arguments);
			$baseCollectionInfo = field_collection_item_load($baseTerm -> field_qtabs_click_arguments['und'][0]['value']);
			$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_qtabs_click_arguments'));
			$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
			$targetCollectionInfo -> field_tab_type = $baseCollectionInfo -> field_tab_type;
			$targetCollectionInfo -> field_tab_content = $baseCollectionInfo -> field_tab_content;
			$targetCollectionInfo -> field_view_display = $baseCollectionInfo -> field_view_display;
			$targetCollectionInfo -> field_view_arguments = $baseCollectionInfo -> field_view_arguments;
			$targetCollectionInfo -> save();
			$targetTerm -> field_qtabs_click_arguments['und'][0]['value'] = $targetCollectionInfo -> item_id;
		}
		//field_default_fieldset
		if (isset($baseTerm -> field_default_fieldset['und'][0]['value'])) {
			unset($targetTerm -> field_default_fieldset);
			$fieldsetCount = count($baseTerm -> field_default_fieldset['und']);
			for ($i = 0; $i < $fieldsetCount; $i++) {
				$baseCollectionInfo = field_collection_item_load($baseTerm -> field_default_fieldset['und'][$i]['value']);
				$targetCollectionInfo = entity_create('field_collection_item', array('field_name' => 'field_default_fieldset'));
				$targetCollectionInfo -> setHostEntity('taxonomy_term', $targetTerm);
				$targetCollectionInfo -> field_field_name = $baseCollectionInfo -> field_field_name;
				$targetCollectionInfo -> field_field_value = $baseCollectionInfo -> field_field_value;
				$targetCollectionInfo -> save();
				$targetTerm -> field_default_fieldset['und'][$i]['value'] = $targetCollectionInfo -> item_id;
			}
		}
		taxonomy_term_save($targetTerm);
	}
}

/**
 * Searches haystack for needle and returns an array of the key path if it is found in the (multidimensional) array, FALSE otherwise.
 *
 * mixed array_searchRecursive ( mixed needle, array haystack [, bool strict[, array path]] )
 */
function array_searchRecursive_get_key_path($needle, $haystack, $strict = false, $path = array()) {
	if (!is_array($haystack)) {
		return false;
	}

	foreach ($haystack as $key => $val) {
		if (is_array($val) && $subPath = array_searchRecursive_get_key_path($needle, $val, $strict, $path)) {
			$path = array_merge($path, array($key), $subPath);
			return $path;
		} elseif ((!$strict && $val == $needle) || ($strict && $val === $needle)) {
			$path[] = $key;
			return $path;
		}
	}
	return false;
}

function array_flatten($array) {
	if (!is_array($array)) {
		return FALSE;
	}
	$result = array();
	foreach ($array as $key => $value) {
		if (is_array($value)) {
			$result = array_merge($result, array_flatten($value));
		} else {
			$result[$key] = $value;
		}
	}
	return $result;
}

function objectToArray($d) {
	if (is_object($d)) {
		// Gets the properties of the given object
		// with get_object_vars function
		$d = get_object_vars($d);
	}

	if (is_array($d)) {
		/*
		 * Return array converted to object
		 * Using __FUNCTION__ (Magic constant)
		 * for recursive call
		 */
		return array_map(__FUNCTION__, $d);
	} else {
		// Return array
		return $d;
	}
}

function _indent_json_string($json) {

	$result = '';
	$pos = 0;
	$strLen = strlen($json);
	//$indentStr   = '  ';
	$indentStr = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
	//$newLine     = "\n";
	$newLine = "<br/>";
	$prevChar = '';
	$outOfQuotes = true;

	for ($i = 0; $i <= $strLen; $i++) {

		// Grab the next character in the string.
		$char = substr($json, $i, 1);

		// Are we inside a quoted string?
		if ($char == '"' && $prevChar != '\\') {
			$outOfQuotes = !$outOfQuotes;

			// If this character is the end of an element,
			// output a new line and indent the next line.
		} else if (($char == '}' || $char == ']') && $outOfQuotes) {
			$result .= $newLine;
			$pos--;
			for ($j = 0; $j < $pos; $j++) {
				$result .= $indentStr;
			}
		}

		// Add the character to the result string.
		$result .= $char;

		// If the last character was the beginning of an element,
		// output a new line and indent the next line.
		if (($char == ',' || $char == '{' || $char == '[') && $outOfQuotes) {
			$result .= $newLine;
			if ($char == '{' || $char == '[') {
				$pos++;
			}

			for ($j = 0; $j < $pos; $j++) {
				$result .= $indentStr;
			}
		}

		$prevChar = $char;
	}

	return $result;
}

function _fill_blank_string_for_timeslot($str) {
	$value = intval($str);
	if ($value / 10 < 1) {
		$str = '0' . $str;
	}
	return $str;
}

// function build_navigation_bar() {
// 	global $user;

// 	$path = current_path();
// 	//dpm( $path, 'current path');
// 	// test, test
// 	$menu = array('dash' => array('href' => '/', 'icon' => 'dash', 'prefix' => 'node', 'title' => 'Home'), 'product' => array('href' => '/product_designer/Mobile', 'icon' => 'gal', 'prefix' => 'product_designer', 'title' => 'Product Designer', 'role' => 'product designer', 'sub' => array( array('/product_designer/Mobile', 'Mobile'), array('/product_designer/IPTV', 'IPTV'), array('/product_designer/Broadband', 'Broadband'), array('/product_designer/VoIP', 'VoIP'), array('/product_designer/Satellite', 'Satellite'), array('/product_designer/Dummy', 'Dummy'), array('/product_designer/Cross', 'Bundle'))), 'relation' => array('href' => '/relation/product/hierarchy/Mobile', 'icon' => 'widgets', 'prefix' => 'relation', 'title' => 'Relation Manager', 'role' => 'relation manager', ), 'lifecycle' => array('href' => '/lifecycles/deploy/PRODUCT', 'icon' => 'anlt', 'prefix' => 'lifecycles', 'title' => 'Lifecycle', 'role' => 'lifecycle manager'), 'common' => array('href' => '/common/numberingplan/domestic/list', 'icon' => 'typ', 'prefix' => 'common', 'title' => 'Common Data', 'role' => 'common data manager', 'sub' => array( array('/common/counter/list', 'Counters'), array('/common/numberingplan/domestic/list', 'Numbering Plan'), array('/common/roaming/country/list', 'Roaming Plan'), array('/common/packet/predefined/charging_rule/list', 'Packet'), array('/common/vouchercardtype', 'ETC'), )), 'simulator' => array('href' => '/simulator/test/voice', 'icon' => 'grid', 'prefix' => 'simulator/', 'title' => 'Simulator', 'role' => 'simulator', ), 'ocs' => array('href' => '/config/ocs', 'icon' => 'tb', 'prefix' => 'config/ocs', 'title' => 'OCS', 'role' => 'ocs manager'), );

// 	$output = '';
// 	foreach ($menu as $item) {

// 		if (!in_array('administrator', $user -> roles)) {
// 			if (isset($item['role']) && !in_array($item['role'], $user -> roles))
// 				continue;
// 		}

// 		$image = '/sites/default/files/images/nav/' . $item['icon'];
// 		//dpm( $item['prefix']);
// 		if (strpos($path, $item['prefix'], 0) === 0)
// 			$image .= '-active.png';
// 		else
// 			$image .= '.png';

// 		$sub_menu = '';
// 		if (array_key_exists('sub', $item)) {
// 			foreach ($item['sub'] as $title) {
// 				$sub_menu .= t('<li><a href="@href">@title</a></li>', array('@href' => $title[0], '@title' => $title[1]));
// 			}
// 			$sub_menu = '<ul class="sub-nav">' . $sub_menu . '</ul>';
// 		}

// 		$output .= t('<li class="nav-item"><a href="@href"><img src="@image" alt="" /><p>@title</p></a>!sub</li>', array('@href' => $item['href'], '@image' => $image, '@title' => $item['title'], '!sub' => $sub_menu));
// 	}

// 	print '<div class="top-bar"><ul id="nav">' . $output . '</ul></div>';
// }

function _get_nids_from_views($view_name, $display, $args) {
	$retArray = array();

	$view = views_get_view($view_name);
	$view -> set_display($display);
	$view -> set_arguments($args);
	$view -> execute();

	foreach ($view->result as $record) {
		$retArray[] = $record -> nid;
	}
	return $retArray;
}

function _get_records_from_views($view_name, $display, $args) {

	$view = views_get_view($view_name);
	$view -> set_display($display);
	$view -> set_arguments($args);
	$view -> execute();

	return $view -> result;
}

function _get_records_from_views_by_label($view_name, $display, $args, $req_labels) {
	$retArray = array();

	$view = views_get_view($view_name);
	$view -> set_display($display);
	$view -> set_arguments($args);
	$view -> execute();

	foreach ($view->result as $record) {
		$tmpRecord = array();
		foreach ($req_labels as $key => $value) {
			$tmpRecord[$key] = view_get_field_value_by_label($view, $value, $record);
		}
		$retArray[] = $tmpRecord;
	}
	return $retArray;
}

function session_get($session_name, $default = NULL) {
	if (isset($_SESSION[$session_name])) {
		return $_SESSION[$session_name];
	}
	return $default;
}

function session_set($session_name, $session_value) {
	$_SESSION[$session_name] = $session_value;
}

function field_instance_copy() {
	$field = field_info_instance('taxonomy_term', 'field_default_fieldset', 'tpl_default_tree_mobile_main_prepaid');
	$voca_names = taxonomy_vocabulary_get_names();
	foreach ($voca_names as $key => $value) {
		if (strncmp($key, 'tpl_default_tree', 16) == 0) {

			if (($key != 'tpl_default_tree_mobile_main_prepaid') && ($key != 'tpl_default_tree_mobile_main_postpaid') && ($key != 'tpl_default_tree_cross_main')) {
				$field_instance = array('field_name' => $field['field_name'], 'entity_type' => 'taxonomy_term', 'bundle' => $key, 'label' => $field['label'], 'description' => $field['description'], 'widget' => $field['widget'], );
				field_create_instance($field_instance);
			}
		}
	}
}

function _get_redirect_url_in_list_all($content_type, $params) {
	$url = array();
	$url = _get_redirect_url_in_create_n_list('list', $content_type, $params);

	return $url;
}

function _get_redirect_url_in_create($content_type, $params) {
	$url = array();

	$url = _get_redirect_url_in_create_n_list('add', $content_type, $params);

	return $url;
}

function _get_redirect_url_in_delete($node) {
	$url = array();
	$url = _get_redirect_url_in_view_n_delete('del', $node);
	return $url;
}

function _get_custom_page($node) {
	$url = array();
	$url = _get_redirect_url_in_view_n_delete('view', $node);
	return $url;
}

function _get_redirect_url_in_view_n_delete($viewOrDel, $node) {
	$url = array();
	switch($node->type) {
		case 'campaign' :
		case 'application':
		case 'message':
		case 'target':
		case 'rich_message':
			// $fragments = array('campaign' => 'quickset-menu=0');
			$fragments = array(
				'campaign' => '',
				'rich_message'=>'quickset-menu=1',
				'message'=>'quickset-menu=2',
				'target'=>'quickset-menu=3',
				'application'=>'quickset-menu=4'
			);
			if ($viewOrDel == 'view') {
				$url['path'] = 'custom_edit/'.$node->type.'/'.$node ->nid;
			} else {
				$url['path'] = $node->type.'/list';
			}
			$url['fragment'] = $fragments[$node -> type];
			break;
	}
	return $url;
}

// $createOrList = 'add', 'list'
//
function _get_redirect_url_in_create_n_list($addOrList, $content_type, $params) {
	$url = array();

	switch($content_type) {
		case 'campaign' :
		case 'application':
		case 'message':
		case 'target':
		case 'rich_message':
			// $fragments = array('campaign' => 'quickset-menu=0');
			$fragments = array(
				'campaign' => '',
				'rich_message'=>'quickset-menu=1',
				'message'=>'quickset-menu=2',
				'target'=>'quickset-menu=3',
				'application'=>'quickset-menu=4',
				'report'=>'quickset-menu=5'
			);
			if ($addOrList == 'add') {
				$url['path'] = 'custom_add/'.$content_type.'/add';
			} else {
				$url['path'] = $content_type.'/list';
			}
			$url['fragment'] = $fragments[$content_type];
			break;
	}
	return $url;
}

function set_permissions_all_checked() {
	// $allRoles = array('product designer', 'relation manager', 'lifecycle manager', 'common data manager', 'simulator', 'ocs manager', 'account manager');
	$allRoles = user_roles();
	foreach ($allRoles as $rid => $role_name) {
		// $user = user_role_load_by_name($role);
		user_role_grant_permissions($rid, array_keys(module_invoke_all('permission')));
	}
}

function is_integer_string($value) {
	if (!is_numeric($value)) {
		return FALSE;
	}

	$value2 = (int)$value;
	if ($value2 != $value) {
		return FALSE;
	}
	return TRUE;
}

function is_integer_between_range($value) {
	$MAX_INT_VALUE = 1000000000;
	$MIN_INT_VALUE = -10000000000;

	if ($value < $MIN_INT_VALUE) {
		return -1;
	} elseif ($value > $MAX_INT_VALUE) {
		return 1;
	} else {
		return 0;
	}

}

//field 삭제
function delete_field($fields) {
	foreach ($fields as $field_name) {
		field_delete_field($field_name);
	}

	/*
	 $fields = array('field_can_be_overidden',
	 'field_char_relationship_type',
	 'field_char_spec_seq',
	 'field_custom_value',
	 'field_default',
	 'field_derivation_formula',
	 'field_extensible',
	 'field_id',
	 'field_is_group_call',
	 'field_lower_limit',
	 'field_max_amount_of_sms',
	 'field_max_cardinality',
	 'field_min_cardinality',
	 'field_offering_rel_type',
	 'field_package',
	 'field_r_bundledprodofferoption',
	 'field_r_prodcharvalueref',
	 'field_r_prodspeccharrelationship',
	 'field_r_prodspeccharvalue',
	 'field_r_prodspeccharvaluerel',
	 'field_r_productofferingprice',
	 'field_r_productspecchar',
	 'field_range_interval',
	 'field_ref_productattribute',
	 'field_start_date',
	 'field_unique',
	 'field_unit_of_measure',
	 'field_upper_limit',
	 'field_value_from',
	 'field_value_to',
	 'field_value_type');
	 */
}
