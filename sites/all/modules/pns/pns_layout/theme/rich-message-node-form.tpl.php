<?php
/**
 * @file
 * Template to layout of rich message
 */
//echo drupal_render_children($form);
//dsm($form,'form'); 
?>
<div id="demo_wrapper" class="edit">
  <div class="container-fluid">
    <!-- title -->
    <div class="row-fluid">
      <div class="form-group">
        <label for="node-title" class="col-xs-2 control-label">Title</label>
        <div class="col-xs-8">
          <?php 
            $echo_str = '';
            if(isset($form['#node']->nid)){
              $node_save_type = 'edit';
              $node_nid = $form['#node']->nid;
              $node_title = $form['#node']->title;
            }else{
              $node_save_type = 'add';
              $node_nid = NULL;
              $node_title = NULL;
            }
            $echo_str = '<input type="text" class="form-control" id="node-title" maxlength="128" value="'.$node_title.'">';
            $echo_str .='<input type="hidden" id="node-save-type" value="'.$node_save_type.'">';
            $echo_str .= '<input type="hidden" id="node-nid" value="'.$node_nid.'">';
            echo $echo_str;
          ?>
        </div>
      </div>
    </div>
    <!-- demo -->
    <div class="row-fluid">
      <!-- dropzone start-->
      <div class="demo ui-sortable col-xs-10" style="min-height: 304px; ">      
        <?php 
          if(isset($form['#node']->nid)){
            echo $form['#node']->field_layout_html['und'][0]['value'];
          }
        ?>
      </div>
      <!-- end demo -->
      <!-- menu zone start -->
      <div class="col-xs-2">
        <div class="sidebar-nav">
          <div class="panel-group" id="accordion">
            <div class="panel panel-default">
              <div class="panel-heading">
                <h4 class="panel-title">
                  <a data-toggle="collapse" data-parent="#accordion" href="#gridSystems">
                    <i class="glyphicon glyphicon-plus"></i> Grid System </li>
                  </a>
                </h4>
              </div>
              <div id="gridSystems" class="panel-collapse collapse in">
                <div class="panel-body">
                  <div class="lyrow ui-draggable"> 
                    <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                    <div class="preview">
                      <input value="12" type="text" disabled>
                    </div>
                    <div class="view">
                      <div class="row-fluid clearfix">
                        <div class="col-xs-12 col-sm-12 column"></div>
                      </div>
                    </div>
                  </div> 
                  <div class="lyrow ui-draggable"> 
                    <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                    <div class="preview">
                      <input value="6 6" type="text" disabled>
                    </div>
                    <div class="view">
                      <div class="row-fluid clearfix">
                        <div class="col-xs-6 col-sm-6 column"></div>
                        <div class="col-xs-6 col-sm-6 column"></div>
                      </div>
                    </div>
                  </div> 
                  <div class="lyrow ui-draggable"> 
                    <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                    <div class="preview">
                      <input value="4 4 4" type="text" disabled>
                    </div>
                    <div class="view">
                      <div class="row-fluid clearfix">
                        <div class="col-xs-4 col-sm-4 column"></div>
                        <div class="col-xs-4 col-sm-4 column"></div>
                        <div class="col-xs-4 col-sm-4 column"></div>
                      </div>
                    </div>
                  </div>                
                </div>
              </div>
            </div>
            <div class="panel panel-default">
              <div class="panel-heading">
                <h4 class="panel-title">
                  <a data-toggle="collapse" data-parent="#accordion" href="#components">
                    <i class="glyphicon glyphicon-plus"></i> Components
                  </a>
                </h4>
              </div>
              <div id="components" class="panel-collapse collapse">
                <div class="panel-body">
                  <div class="box box-element ui-draggable"> 
                    <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                    <span class="configuration">
                      <button type="button" class="btn btn-default btn-xs" data-target="#editorModal" role="button" data-toggle="modal">Editor</button> 
                      <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Alignment <span class="caret"></span></a>
                        <ul class="dropdown-menu">
                          <li class="active"><a href="#" rel="">Default</a></li>
                          <li class=""><a href="#" rel="text-left">Left</a></li>
                          <li class=""><a href="#" rel="text-center">Center</a></li>
                          <li class=""><a href="#" rel="text-right">Right</a></li>
                        </ul>
                      </span> 
                      <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Mark <span class="caret"></span></a>
                        <ul class="dropdown-menu">
                          <li class="active"><a href="#" rel="">Default</a></li>
                          <li class=""><a href="#" rel="muted">Disable</a></li>
                          <li class=""><a href="#" rel="text-warning">Warning</a></li>
                          <li class=""><a href="#" rel="text-error">Error</a></li>
                          <li class=""><a href="#" rel="text-info">Prompt</a></li>
                          <li class=""><a href="#" rel="text-success">Success</a></li>
                        </ul>
                      </span>
                    </span>
                    <div class="preview">Title</div>
                    <div class="view">
                      <h3 contenteditable="true">h3. Title adjfaksdjfk.</h3>
                    </div>
                </div>
                <div class="box box-element ui-draggable">
                    <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                    <span class="configuration"><button type="button" class="btn btn-default btn-xs" data-target="#editorModal" role="button" data-toggle="modal">Editor</button> <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Alignment <span class="caret"></span></a>
                  <ul class="dropdown-menu">
                    <li class="active"><a href="#" rel="">Default</a></li>
                    <li class=""><a href="#" rel="text-left">Left</a></li>
                    <li class=""><a href="#" rel="text-center">Center</a></li>
                    <li class=""><a href="#" rel="text-right">Right</a></li>
                  </ul>
                  </span> <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Mark <span class="caret"></span></a>
                  <ul class="dropdown-menu">
                    <li class="active"><a href="#" rel="">Default</a></li>
                    <li class=""><a href="#" rel="muted">Disable</a></li>
                    <li class=""><a href="#" rel="text-warning">Warning</a></li>
                    <li class=""><a href="#" rel="text-error">Error</a></li>
                    <li class=""><a href="#" rel="text-info">Prompt</a></li>
                    <li class=""><a href="#" rel="text-success">Success</a></li>
                  </ul>
                  </span> <a class="btn btn-xs btn-default" href="#" rel="lead">Lead</a> </span>
                  <div class="preview">Paragraph</div>
                  <div class="view" contenteditable="true">
                    <p><em>Git</em>aaaa <b>Linus Torvalds</b>bbbb </p>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                    <i class="glyphicon glyphicon-remove"></i>Delete
                  </a> 
                  <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration">
                    <button type="button" class="btn btn-default btn-xs" data-target="#editorModal" role="button" data-toggle="modal">Editor</button>
                  </span>
                  <div class="preview">Address</div>
                  <div class="view">
                    <address contenteditable="true">
                    <strong>Twitter, Inc.</strong><br>
                    795 Folsom Ave, Suite 600<br>
                    San Francisco, CA 94107<br>
                    <abbr title="Phone">P:</abbr> (123) 456-7890
                    </address>
                  </div>
                </div>
                <div class="box box-element ui-draggable">
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                 <span class="configuration"> <a class="btn btn-xs btn-default" href="#" rel="pull-right">Alignment</a> </span>
                  <div class="preview">Blockquote</div>
                  <div class="view clearfix">
                    <blockquote contenteditable="true">
                      <p>github  .</p>
                      <small>aaa<cite title="Source Title">bbb</cite></small> </blockquote>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Unordered List</div>
                  <div class="view">
                    <ul contenteditable="true">
                      <li>aaaa</li>
                      <li>bbbb</li>
                      <li>cccc</li>
                      <li>dddd</li>
                    </ul>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Ordered List</div>
                  <div class="view">
                    <ol contenteditable="true">
                      <li>1111</li>
                      <li>2222</li>
                      <li>3333</li>
                      <li>4444</li>
                    </ol>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button> <a class="btn btn-xs btn-default" href="#" rel="dl-horizontal">Vertical Alignment</a> </span>
                  <div class="preview">Description</div>
                  <div class="view">
                    <dl contenteditable="true">
                      <dt>Rolex</dt>
                      <dd>aaaa</dd>
                      <dt>Vacheron Constantin</dt>
                      <dd>bbbbbb</dd>
                      <dd>cccc</dd>
                      <dt>IWC</dt>
                      <dd>....</dd>
                      <dt>Cartier</dt>
                      <dd>adfasdfasdf</dd>
                    </dl>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button> 
                  <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Style <span class="caret"></span></a>
                  <ul class="dropdown-menu">
                    <li class="active"><a href="#" rel="">Default</a></li>
                    <li class=""><a href="#" rel="table-striped">Stripped</a></li>
                    <li class=""><a href="#" rel="table-bordered">Bordered</a></li>
                  </ul>
                  </span> <a class="btn btn-xs btn-default" href="#" rel="table-condensed">Condensed</a> </span>
                  <div class="preview">Table</div>
                  <div class="view">
                    <table class="table" contenteditable="true">
                      <thead>
                        <tr>
                          <th>aaa</th>
                          <th>bbb</th>
                          <th>ccc</th>
                          <th>ddd</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>TB - Monthly</td>
                          <td>01/04/2012</td>
                          <td>Default</td>
                        </tr>
                        <tr class="success">
                          <td>1</td>
                          <td>TB - Monthly</td>
                          <td>01/04/2012</td>
                          <td>Approved</td>
                        </tr>
                        <tr class="error">
                          <td>2</td>
                          <td>TB - Monthly</td>
                          <td>02/04/2012</td>
                          <td>Declined</td>
                        </tr>
                        <tr class="warning">
                          <td>3</td>
                          <td>TB - Monthly</td>
                          <td>03/04/2012</td>
                          <td>Pending</td>
                        </tr>
                        <tr class="info">
                          <td>4</td>
                          <td>TB - Monthly</td>
                          <td>04/04/2012</td>
                          <td>Call in to confirm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                 <span class="configuration"> <button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor </button>
                 <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Style <span class="caret"></span></a>
                  <ul class="dropdown-menu">
                    <li class="active"><a href="#" rel="">Default</a></li>
                    <li class=""><a href="#" rel="img-rounded">Rounded</a></li>
                    <li class=""><a href="#" rel="img-circle">Circle</a></li>
                    <li class=""><a href="#" rel="img-thumbnail">Thumbnail</a></li>
                  </ul>
                  </span> </span>

                  <div class="preview">Image</div>
                  <div class="view"> <img alt="140x140" src="<?php echo  '/'.drupal_get_path('module', 'pns_layout').'/img/a.jpg'?>" contenteditable="true"> </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                 <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Badge</div>
                  <div class="view"> <span class="badge" contenteditable="true">123</span> 
                  <button class="btn btn-primary" type="button" id="aeaoofnhgocdbnbeljkmbjdmhbcokfdb-mousedown">
                    Messages <span class="badge" contenteditable="true">456</span>
                   </button>
                   </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                 <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button> <a class="btn btn-xs btn-default" href="#" rel="well">Embed</a> </span>
                  <div class="preview">Jumbotron</div>
                  <div class="view">
                    <div class="hero-unit" contenteditable="true">
                      <h1>Hello, world!</h1>
                      <p>Drag ..  </p>
                      <p><a class="btn btn-primary btn-large" href="#">See more»</a></p>
                    </div>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Page Header</div>
                  <div class="view">
                    <div class="page-header" contenteditable="true">
                      <h1>Title <small> abcdef </small></h1>
                    </div>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Text</div>
                  <div class="view">
                    <h2 contenteditable="true">Title</h2>
                    <p contenteditable="true">adsfjaskfdjkasfdjk.</p>
                    <p><a class="btn" href="#" contenteditable="true">TEST »</a></p>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"> <span class="btn-group"> <a class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" href="#">Style <span class="caret"></span></a>
                  <ul class="dropdown-menu">
                    <li class="active"><a href="#" rel="alert-success">Success</a></li>
                    <li class=""><a href="#" rel="alert-info">Info</a></li>
                    <li class=""><a href="#" rel="alert-warning">Warning</a></li>
                    <li class=""><a href="#" rel="alert-danger">Danger</a></li>
                  </ul>
                  </span> </span>
                  <div class="preview">Alerts</div>
                  <div class="view">
                    <div class="alert alert-success" contenteditable="true">
                      <button type="button" class="close" data-dismiss="alert">×</button>
                      <h4>Alert!</h4>
                      <strong>Warning!</strong> Best check yo self. you're not looking too good. </div>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Collapse</div>
                  <div class="view">
                    <div class="accordion" id="myAccordion">
                      <div class="accordion-group">
                        <div class="accordion-heading"> <a class="accordion-toggle" data-toggle="collapse" data-parent="#myAccordion" href="#collapseOne" contenteditable="true"> Item #1 </a> </div>
                        <div id="collapseOne" class="accordion-body collapse in">
                          <div class="accordion-inner" contenteditable="true"> Content... </div>
                        </div>
                      </div>
                      <div class="accordion-group">
                        <div class="accordion-heading"> <a class="accordion-toggle" data-toggle="collapse" data-parent="#myAccordion" href="#collapseTwo" contenteditable="true"> Item #2 </a> </div>
                        <div id="collapseTwo" class="accordion-body collapse">
                          <div class="accordion-inner" contenteditable="true"> Function块... </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="box box-element ui-draggable"> 
                  <a href="#close" class="remove btn btn-danger btn-xs">
                      <i class="glyphicon glyphicon-remove"></i>Delete
                    </a> 
                    <label class="drag btn btn-success btn-xs"><i class="glyphicon glyphicon-move"></i>Drag</label>
                  <span class="configuration"><button type="button" class="btn btn-xs btn-default" data-target="#editorModal" role="button" data-toggle="modal">Editor</button></span>
                  <div class="preview">Carousel</div>
                  <div class="view">
                    <div class="carousel slide" id="myCarousel">
                      <ol class="carousel-indicators">
                        <li class="active" data-slide-to="0" data-target="#myCarousel"></li>
                        <li data-slide-to="1" data-target="#myCarousel" class=""></li>
                        <li data-slide-to="2" data-target="#myCarousel" class=""></li>
                      </ol>
                      <div class="carousel-inner">
                        <div class="item active"> <img alt="" src="<?php echo  '/'.drupal_get_path('module', 'pns_layout').'/img/1.jpg'?>">
                          <div class="carousel-caption" contenteditable="true">
                            <h4>Baseball</h4>
                            <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                          </div>
                        </div>
                        <div class="item"> <img alt="" src="<?php echo  '/'.drupal_get_path('module', 'pns_layout').'/img/2.jpg'?>">
                          <div class="carousel-caption" contenteditable="true">
                            <h4>Second</h4>
                            <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                          </div>
                        </div>
                        <div class="item"> <img alt="" src="<?php echo  '/'.drupal_get_path('module', 'pns_layout').'/img/3.jpg'?>">
                          <div class="carousel-caption" contenteditable="true">
                            <h4>Third</h4>
                            <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>
                          </div>
                        </div>
                      </div>
                      <a data-slide="prev" href="#myCarousel" class="left carousel-control">‹</a> <a data-slide="next" href="#myCarousel" class="right carousel-control">›</a> </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- menu zone end -->
      <!-- span-->
      <div id="download-layout">
        <div class="container-fluid"></div>
      </div>
    </div>
    <!-- submit -->
    <div class="row-fluid">
      <div class="form-group">
        <div class="col-xs-12">
          <button type="button" class="btn btn-primary" id="node-save">Save</button>
        </div>
      </div>
    </div>
    <!-- row --> 
  </div>
  <!-- fluid-container --> 
  <div class="modal fade" role="dialog" id="editorModal">
  	<div class="modal-dialog">
  		<div class="modal-content">
  			<div class="modal-header"> <a class="close" data-dismiss="modal">×</a>
  				<h3>Editor</h3>
  			</div>
  			<div class="modal-body">
  				<p>
  					<textarea id="contenteditor"></textarea>
  				</p>
  			</div>
  			<div class="modal-footer"> <a id="savecontent" class="btn btn-primary" data-dismiss="modal">Save</a> <a class="btn" data-dismiss="modal">Close</a> </div>
  		</div>
  	</div>
  </div>
  <div class="modal fade" role="dialog" id="downloadModal">
  	<div class="modal-dialog">
  		<div class="modal-content">
  			<div class="modal-header"> <a class="close" data-dismiss="modal">×</a>
  				<h3>Download</h3>
  			</div>
  			<div class="modal-body">
  				<p>Has generated a clean HTML below you can copy and paste the code into your project</p>
  				<div class="btn-group">
  					<button type="button" id="fluidPage" class="active btn btn-info"><i class="glyphicon glyphicon-fullscreen"></i> Adaptive width</button>
  					<button type="button" class="btn btn-info" id="fixedPage"><i class="glyphicon glyphicon-screenshot"></i> Fixed width</button>
  				</div>
  				<br>
  				<br>
  				<p>
  					<textarea></textarea>
  				</p>
  			</div>
  			<div class="modal-footer"> <a class="btn" data-dismiss="modal">Close</a> </div>
  		</div>
  	</div>
  </div>
  <div class="modal hide fade" role="dialog" id="shareModal">
    <div class="modal-header"> <a class="close" data-dismiss="modal">×</a>
      <h3>Save</h3>
    </div>
    <div class="modal-body">Successfully saved</div>
    <div class="modal-footer"> <a class="btn" data-dismiss="modal">Close</a> </div>
  </div>
</div>
