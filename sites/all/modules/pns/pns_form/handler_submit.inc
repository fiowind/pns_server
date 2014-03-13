<?php

function pns_form_node_submit($node, $form, &$form_state) {
	
}

function _insert_direct_push_message($campaign_node){
	$maximum_retry_cnt = 5;
	$status_requesting = 'requesting';

	$message_id = $campaign_node->field_ref_message['und'][0]['target_id'];
	$message_node = node_load($message_id);

	$url_prefix = 'http://pns.uangel.com/push/'.$campaign_node->nid.'/direct/';

	$scheduled_at = time();
	$schedule_option_term = taxonomy_term_load($campaign_node->field_schedule_option['und'][0]['tid']);
	if($schedule_option_term->name != 'Immediate'){
		$campaign_schduled_at_date = new DateTime($campaign_node->field_push_starts_at['und'][0]['value']);
		$scheduled_at = $campaign_schduled_at_date->getTimestamp();
	}

	//loop for target
	if(isset($campaign_node->field_ref_target)){
		$app_clients = array();
		$applications = array();

		foreach($campaign_node->field_ref_target['und'] as $item){
			$target_id = $item['target_id'];
			$target_node = node_load($target_id);
			//target condition filtering
			$os = NULL;
			if(isset($target_node->field_ref_operating_system['und'][0]['tid'])){
				$os = $target_node->field_ref_operating_system['und'][0]['tid'];
			};

			$device_brand = array();
			if(isset($target_node->field_ref_device_brand)){
				foreach($target_node->field_ref_device_brand['und'] as $record){
					$device_brand[] = $record['tid'];
				}
			}
			$device_brand = join('+',$device_brand);

			$device_model = array();
			if(isset($target_node->field_ref_device_model['und'])){
				foreach($target_node->field_ref_device_model['und'] as $record){
					$device_model[] = $record['target_id'];
				}
			}
			$device_model = join('+',$device_model);

			$locale = array();
			if(isset($target_node->field_ref_locale['und'])){
				foreach($target_node->field_ref_locale['und'] as $record){
					$locale[] = $record['tid'];
				}
			}
			$locale = join('+',$locale);

			//TODO: Resolution Filtering
			
			//loop for applications in the target
			foreach($target_node->field_ref_application['und'] as $record){
				$application_id = $record['target_id'];
				if(!isset($applications[$application_id])){
					$applications[$application_id] = node_load($application_id);
				}
				$args = array('0' => $application_id, 
						  '1' => $os,
						  '2' => $device_brand,
						  '3' => $device_model,
						  '4' => $locale
					);

				$view = views_get_view('list_app_client');
				$view -> set_display('panel_pane_2');
				$view -> set_arguments($args);
				$view -> execute();
				$view_result = $view -> result;

				foreach($view_result as $view_record){
					$app_clients[$view_record->nid] = $view_record->_field_data['nid']['entity'];
				}
			}

			//TODO: Filter same device
		}


		//insert direct messages based on $app_clients
		$total_app_client_count = 0;
		foreach($app_clients as $client){
			$entity = new stdClass();
			$entity->entity_type = 'data_push_direct';
			$entity->data_table = 'push_direct';

			$entity->device_id = $client->field_device_id['und'][0]['safe_value'];
			$application_nid = $client->field_ref_app['und'][0]['target_id'];
			$entity->app_id = $applications[$application_nid ]->field_app_id['und'][0]['safe_value'];
			$entity->maximum_retry_cnt = $maximum_retry_cnt;
			$entity->attempted_retry_cnt = 0;
			$entity->url = $url_prefix.$client->nid;
			$entity->requested_at = time();
			$entity->scheduled_at = $scheduled_at;
			$entity->status = $status_requesting;

			if(isset($applications[$application_nid]->field_api_key['und'][0]['safe_value'])){
				$entity->gcm_api_key = $applications[$application_nid]->field_api_key['und'][0]['safe_value'];
			}
			if(isset($client->field_push_token['und'][0]['safe_value'])){
				$entity->push_token = $client->field_push_token['und'][0]['safe_value'];
			}

			//TODO: change sender and callback mdn based on application
			$entity->sms_sender_mdn = '01087259388';
			$entity->sms_callback_mdn = '01087259388'; 

			if(isset($client->field_mdn['und'][0]['safe_value'])){
				$entity->sms_receiver_mdn = $client->field_mdn['und'][0]['safe_value'];
			}

			if(isset($message_node->field_short_message['und'][0]['safe_value'])){
				$entity->sms_text = $message_node->field_short_message['und'][0]['safe_value'];
			}

			$entity->field_ref_campaign['und'][0]['target_id'] = $campaign_node->nid;
			$entity->field_ref_app_client['und'][0]['target_id'] = $client->nid;

			entity_save('data_push_direct', $entity);

			$total_app_client_count++;
		}

		$c_node = node_load($campaign_node->nid);
		$c_node->field_total_app_client_count['und'][0]['value'] = $total_app_client_count;
		node_save($c_node);
	}
}

