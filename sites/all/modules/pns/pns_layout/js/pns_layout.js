(function($) {
	$.fn.supportstorage = function() {
		if (typeof window.localStorage=='object') 
			return true;
		else
			return false;		
	};

	$.fn.handleSaveLayout = function() {
		var e = $(".demo").html();
		if (!stopsave && e != window.demoHtml) {
			stopsave++;
			window.demoHtml = e;
			$.fn.saveLayout();
			stopsave--;
		}
	};

	var layouthistory; 
	$.fn.saveLayout = function(){
		var data = layouthistory;
		if (!data) {
			data={};
			data.count = 0;
			data.list = [];
		}
		if (data.list.length>data.count) {
			for (i=data.count;i<data.list.length;i++)
				data.list[i]=null;
		}
		data.list[data.count] = window.demoHtml;
		data.count++;
		if ($.fn.supportstorage()) {
			localStorage.setItem("layoutdata",JSON.stringify(data));
		}
		layouthistory = data;
		//console.log(data);
		/*$.ajax({  
			type: "POST",  
			url: "/build/saveLayout",  
			data: { layout: $('.demo').html() },  
			success: function(data) {
				//updateButtonsVisibility();
			}
		});*/
	};

	$.fn.downloadLayout = function(){
		
		$.ajax({  
			type: "POST",  
			url: "/build/downloadLayout",  
			data: { layout: $('#download-layout').html() },  
			success: function(data) { window.location.href = '/build/download'; }
		});
	};

	$.fn.downloadHtmlLayout = function(){
		$.ajax({  
			type: "POST",  
			url: "/build/downloadLayout",  
			data: { layout: $('#download-layout').html() },  
			success: function(data) { window.location.href = '/build/downloadHtml'; }
		});
	};

	$.fn.undoLayout = function() {
		var data = layouthistory;
		//console.log(data);
		if (data) {
			if (data.count<2) return false;
			window.demoHtml = data.list[data.count-2];
			data.count--;
			$('.demo').html(window.demoHtml);
			if (supportstorage()) {
				localStorage.setItem("layoutdata",JSON.stringify(data));
			}
			return true;
		}
		return false;
		/*$.ajax({  
			type: "POST",  
			url: "/build/getPreviousLayout",  
			data: { },  
			success: function(data) {
				undoOperation(data);
			}
		});*/
	};

	$.fn.redoLayout = function() {
		var data = layouthistory;
		if (data) {
			if (data.list[data.count]) {
				window.demoHtml = data.list[data.count];
				data.count++;
				$('.demo').html(window.demoHtml);
				if (supportstorage()) {
					localStorage.setItem("layoutdata",JSON.stringify(data));
				}
				return true;
			}
		}
		return false;
		/*
		$.ajax({  
			type: "POST",  
			url: "/build/getPreviousLayout",  
			data: { },  
			success: function(data) {
				redoOperation(data);
			}
		});*/
	};

	$.fn.handleJsIds = function() {
		$.fn.handleModalIds();
		$.fn.handleAccordionIds();
		$.fn.handleCarouselIds();
		$.fn.handleTabsIds()
	};

	$.fn.handleAccordionIds = function() {
		var e = $(".demo #myAccordion");
		var t = $.fn.randomNumber();
		var n = "accordion-" + t;
		var r;
		e.attr("id", n);
		e.find(".accordion-group").each(function(e, t) {
			r = "accordion-element-" + $.fn.randomNumber();
			$(t).find(".accordion-toggle").each(function(e, t) {
				$(t).attr("data-parent", "#" + n);
				$(t).attr("href", "#" + r)
			});
			$(t).find(".accordion-body").each(function(e, t) {
				$(t).attr("id", r)
			})
		})
	};

	$.fn.handleCarouselIds = function() {
		var e = $(".demo #myCarousel");
		var t = $.fn.randomNumber();
		var n = "carousel-" + t;
		e.attr("id", n);
		e.find(".carousel-indicators li").each(function(e, t) {
			$(t).attr("data-target", "#" + n)
		});
		e.find(".left").attr("href", "#" + n);
		e.find(".right").attr("href", "#" + n)
	};

	$.fn.handleModalIds = function() {
		var e = $(".demo #myModalLink");
		var t = $.fn.randomNumber();
		var n = "modal-container-" + t;
		var r = "modal-" + t;
		e.attr("id", r);
		e.attr("href", "#" + n);
		e.next().attr("id", n)
	};

	$.fn.handleTabsIds = function() {
		var e = $(".demo #myTabs");
		var t = $.fn.randomNumber();
		var n = "tabs-" + t;
		e.attr("id", n);
		e.find(".tab-pane").each(function(e, t) {
			var n = $(t).attr("id");
			var r = "panel-" + $.fn.randomNumber();
			$(t).attr("id", r);
			$(t).parent().parent().find("a[href=#" + n + "]").attr("href", "#" + r)
		})
	};

	$.fn.randomNumber = function() {
		return $.fn.randomFromInterval(1, 1e6)
	};

	$.fn.randomFromInterval = function(e, t) {
		return Math.floor(Math.random() * (t - e + 1) + e)
	};

	$.fn.gridSystemGenerator = function() {
		$(".lyrow .preview input").bind("keyup", function() {
			var e = 0;
			var t = "";
			var n = $(this).val().split(" ", 12);
			$.each(n, function(n, r) {
				e = e + parseInt(r);
				t += '<div class="span' + r + ' column"></div>'
			});
			if (e == 12) {
				$(this).parent().next().children().html(t);
				$(this).parent().prev().show()
			} else {
				$(this).parent().prev().hide()
			}
		})
	};

	$.fn.configurationElm = function(e, t) {
		$(".demo").delegate(".configuration > a", "click", function(e) {
			e.preventDefault();
			var t = $(this).parent().next().next().children();
			$(this).toggleClass("active");
			t.toggleClass($(this).attr("rel"))
		});
		$(".demo").delegate(".configuration .dropdown-menu a", "click", function(e) {
			e.preventDefault();
			var t = $(this).parent().parent();
			var n = t.parent().parent().next().next().children();
			t.find("li").removeClass("active");
			$(this).parent().addClass("active");
			var r = "";
			t.find("a").each(function() {
				r += $(this).attr("rel") + " "
			});
			t.parent().removeClass("open");
			n.removeClass(r);
			n.addClass($(this).attr("rel"))
		})
	};

	$.fn.removeElm = function() {
		$(".demo").delegate(".remove", "click", function(e) {
			e.preventDefault();
			$(this).parent().remove();
			if (!$(".demo .lyrow").length > 0) {
				$.fn.clearDemo()
			}
		})
	};

	$.fn.clearDemo = function() {
		$(".demo").empty();
		layouthistory = null;
		if ($.fn.supportstorage())
			localStorage.removeItem("layoutdata");
	};

	$.fn.removeMenuClasses = function() {
		$("#menu-layoutit li button").removeClass("active")
	};

	$.fn.changeStructure = function(e, t) {
		$("#download-layout ." + e).removeClass(e).addClass(t)
	};

	$.fn.cleanHtml = function(e) {
		$(e).parent().append($(e).children().html())
	};

	$.fn.downloadLayoutSrc = function() {
		var e = "";
		$("#download-layout").children().html($(".demo").html());
		var t = $("#download-layout").children();
		t.find(".preview, .configuration, .drag, .remove").remove();
		t.find(".lyrow").addClass("removeClean");
		t.find(".box-element").addClass("removeClean");
		t.find(".lyrow .lyrow .lyrow .lyrow .lyrow .removeClean").each(function() {
			$.fn.cleanHtml(this)
		});
		t.find(".lyrow .lyrow .lyrow .lyrow .removeClean").each(function() {
			$.fn.cleanHtml(this)
		});
		t.find(".lyrow .lyrow .lyrow .removeClean").each(function() {
			$.fn.cleanHtml(this)
		});
		t.find(".lyrow .lyrow .removeClean").each(function() {
			$.fn.cleanHtml(this)
		});
		t.find(".lyrow .removeClean").each(function() {
			$.fn.cleanHtml(this)
		});
		t.find(".removeClean").each(function() {
			$.fn.cleanHtml(this)
		});
		t.find(".removeClean").remove();
		$("#download-layout .column").removeClass("ui-sortable");
		$("#download-layout .row-fluid").removeClass("clearfix").children().removeClass("column");
		if ($("#download-layout .container").length > 0) {
			$.fn.changeStructure("row-fluid", "row")
		}
		formatSrc = $.htmlClean($("#download-layout").html(), {
			format: true,
			allowedAttributes: [
				["id"],
				["class"],
				["data-toggle"],
				["data-target"],
				["data-parent"],
				["role"],
				["data-dismiss"],
				["aria-labelledby"],
				["aria-hidden"],
				["data-slide-to"],
				["data-slide"]
			]
		});
		$("#download-layout").html(formatSrc);
		$("#downloadModal textarea").empty();
		$("#downloadModal textarea").val(formatSrc);
		return formatSrc;
	};

	var currentDocument = null;
	var timerSave = 1000;
	var stopsave = 0;
	var startdrag = 0;
	var demoHtml = $(".demo").html();
	var currenteditor = null;
	$(window).resize(function() {
		$(".demo").css("min-height", $(window).height() - 160)
	});

	$.fn.restoreData = function(){
		if ($.fn.supportstorage()) {
			layouthistory = JSON.parse(localStorage.getItem("layoutdata"));
			if (!layouthistory) return false;
			window.demoHtml = layouthistory.list[layouthistory.count-1];
			if (window.demoHtml) $(".demo").html(window.demoHtml);
		}
	};

	$.fn.initContainer = function(){
		$(".demo, .demo .column").sortable({
			connectWith: ".column",
			opacity: .35,
			handle: ".drag",
			start: function(e,t) {
				if (!startdrag) stopsave++;
				startdrag = 1;
			},
			stop: function(e,t) {
				if(stopsave>0) stopsave--;
				startdrag = 0;
			}
		});
		$.fn.configurationElm();
	};

	Drupal.behaviors.PNSLayoutBehavior = {
		attach : function(context, settings) {
			CKEDITOR.disableAutoInline = true;
			//$.fn.restoreData();
			var contenthandle = CKEDITOR.replace( 'contenteditor' ,{
				language: 'en',
				// fullPage: true,
				// extraPlugins: 'docprops',
				contentsCss: ['/sites/all/modules/pns/pns_layout/css/bootstrap.min.css'],
				allowedContent: true
			});
			
			$(".demo").css("min-height", $(window).height() - 160);
			$(".sidebar-nav .lyrow").draggable({
				connectToSortable: ".demo",
				helper: "clone",
				handle: ".drag",
				start: function(e,t) {
					if (!startdrag) stopsave++;
					startdrag = 1;
				},
				drag: function(e, t) {
					t.helper.width(400)
				},
				stop: function(e, t) {
					$(".demo .column").sortable({
						opacity: .35,
						connectWith: ".column",
						start: function(e,t) {
							if (!startdrag) stopsave++;
							startdrag = 1;
						},
						stop: function(e,t) {
							if(stopsave>0) stopsave--;
							startdrag = 0;
						}
					});
					if(stopsave>0) stopsave--;
					startdrag = 0;
				}
			});
			$(".sidebar-nav .box").draggable({
				connectToSortable: ".column",
				helper: "clone",
				handle: ".drag",
				start: function(e,t) {
					if (!startdrag) stopsave++;
					startdrag = 1;
				},
				drag: function(e, t) {
					t.helper.width(400)
				},
				stop: function() {
					$.fn.handleJsIds();
					if(stopsave>0) stopsave--;
					startdrag = 0;
				}
			});
			$.fn.initContainer();
			$('#demo_wrapper .demo').on("click","[data-target=#editorModal]",function(e) {
				e.preventDefault();
				currenteditor = $(this).parent().parent().find('.view');
				var eText = currenteditor.html();
				contenthandle.setData(eText);
			});
			$("#savecontent").click(function(e) {
				e.preventDefault();
				currenteditor.html(contenthandle.getData());
			});
			$("[data-target=#downloadModal]").click(function(e) {
				e.preventDefault();
				$.fn.downloadLayoutSrc();
			});
			$("[data-target=#shareModal]").click(function(e) {
				e.preventDefault();
				$.fn.handleSaveLayout();
			});
			$("#download").click(function() {
				$.fn.downloadLayout();
				return false
			});
			$("#downloadhtml").click(function() {
				$.fn.downloadHtmlLayout();
				return false
			});
			$("#edit").click(function() {
				$("#demo_wrapper").removeClass("devpreview sourcepreview");
				$("#demo_wrapper").addClass("edit");
				$.fn.removeMenuClasses();
				$(this).addClass("active");
				return false
			});
			$("#clear").click(function(e) {
				e.preventDefault();
				$.fn.clearDemo()
			});
			$("#devpreview").click(function() {
				$("#demo_wrapper").removeClass("edit sourcepreview");
				$("#demo_wrapper").addClass("devpreview");
				$.fn.removeMenuClasses();
				$(this).addClass("active");
				return false
			});
			$("#sourcepreview").click(function() {
				$("#demo_wrapper").removeClass("edit");
				$("#demo_wrapper").addClass("devpreview sourcepreview");
				$.fn.removeMenuClasses();
				$(this).addClass("active");
				return false
			});
			$("#fluidPage").click(function(e) {
				e.preventDefault();
				$.fn.changeStructure("container", "container-fluid");
				$("#fixedPage").removeClass("active");
				$(this).addClass("active");
				$.fn.downloadLayoutSrc()
			});
			$("#fixedPage").click(function(e) {
				e.preventDefault();
				$.fn.changeStructure("container-fluid", "container");
				$("#fluidPage").removeClass("active");
				$(this).addClass("active");
				$.fn.downloadLayoutSrc()
			});
			$(".nav-header").click(function() {
				$(".sidebar-nav .boxes, .sidebar-nav .rows").hide();
				$(this).next().slideDown()
			});
			$('#undo').click(function(){
				stopsave++;
				if ($.fn.undoLayout()) $.fn.initContainer();
				stopsave--;
			});
			$('#redo').click(function(){
				stopsave++;
				if (r$.fn.edoLayout()) $.fn.initContainer();
				stopsave--;
			});
			$.fn.removeElm();
			$.fn.gridSystemGenerator();
			setInterval(function() {
				$.fn.handleSaveLayout()
			}, timerSave);

			//bind save button
			$("#node-save").click(function(){
				var titleObject = $("#node-title");
				if(titleObject !== undefined || titleObject !== null){
					var titleValue = titleObject[0].value;
					if(titleValue === undefined || titleValue.length == 0){
						alert('title field is required');
					}else{
						$("#node-save").attr("disabled",true);
						var node_save_type = $("#node-save-type")[0].value;
						var node_nid = $("#node-nid")[0].value;
						var layout_html = $(".demo").html();
						var pure_html = $.fn.downloadLayoutSrc();
						console.log(pure_html);
						
						var url = '/save_rich_message/' + titleValue + '/' + node_save_type + '/' + node_nid;
						$.ajax({
							url : url,
							type: "post",
							dataType : 'json',
							data: {'layout_html': layout_html, 'pure_html':pure_html},
							success : function(data) {
								$("#node-save").attr("disabled",false);
								// console.log(data);
								// console.log(data.urlpath);
								$(location).attr('href', data.urlpath);								
							}
						});
					}
				}

			});
		}
	};
})(jQuery);


