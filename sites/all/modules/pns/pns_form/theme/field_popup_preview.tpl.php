<?php

//echo drupal_render_children($form);
//dsm($form);
	if(isset($form['#node']->nid)){
	$system_path = '/sites/default/files/';
	if(isset($form['#node']->field_popup_image['und'][0]['filename'])){
		$img_path = $system_path.$form['#node']->field_popup_image['und'][0]['filename'];
	}else{
		$img_path = NULL;
	}
?>
		<div>
		<b>Preview</b>
		<br/><br/>
		
		<div class="popup_background" style="width:480px;height:800px;">
			<div class="popup_image" style="width:338px;height:175px;">
				<?php
					if(isset($img_path)){
						echo '<img src="'.$img_path.'" style="width:338px;height:175px"/>';
						//$text_color = 'white';
						$text_color = 'black';
					}else{
						$text_color = 'black';
					}
				?>
			</div>
			<div class="popup_text"  style="width:338px;height:175px;<?php echo 'color:'.$text_color.';';?>">
				<?php
					if(isset($form['#node']->field_popup_text['und'][0]['value'])){
						echo $form['#node']->field_popup_text['und'][0]['value'];
					}
				?>
			</div>
		</div>

		<hr/>
<?php
	}
?>
