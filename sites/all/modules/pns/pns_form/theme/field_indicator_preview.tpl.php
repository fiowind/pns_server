<?php

//echo drupal_render_children($form);
//dsm($form);
	if(isset($form['#node']->nid)){
?>
		<div>
		<b>Preview</b>
		<br/><br/>
		<div>
			<img src="/sites/default/files/indicator_background.png"/>
		</div>
		
		<div class="clear_both"></div>
		<div class="indicator_icon" style="width:75px;height:75px;">
			<?php
				$system_path = '/sites/default/files/';
				if(isset($form['#node']->field_indicator_icon['und'][0]['filename'])){
					$icon_path = $system_path.$form['#node']->field_indicator_icon['und'][0]['filename'];
				}else{
					$icon_path = $system_path.'indicator_no_icon.png';
				}
				echo '<img src="'.$icon_path.'" style="width:75px;height:75px;"/>';
			?>
		</div>
		<div class="indicator_text" style="width:405px;height:75px;">
			<?php
				if(isset($form['#node']->field_indicator_text['und'][0]['value'])){
					echo $form['#node']->field_indicator_text['und'][0]['value']; 
				}
			?>
		</div>
		<div class="clear_both"></div>
		<hr/>
<?php
	}
?>
