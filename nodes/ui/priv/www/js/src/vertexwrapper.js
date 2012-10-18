define([
        'src/calculations',
        'src/geometrygraph', 
        'src/interactioncoordinator', 
        'src/scene',
        'src/workplane',
    ], 
    function(calc, geometryGraph, coordinator, sceneModel, workplane) {

    var Model = Backbone.Model.extend({

        initialize: function(vertex) {
            this.vertex = vertex;
            this.views = [
                new DOMView({model: this}),
                new VertexSceneView({model: this}),
            ];
            workplane.on('positionChanged', this.workplanePositionChanged, this);
        },

        destroy: function() {
            this.views.forEach(function(view) {
                view.remove();
            });
            this.views = [];
        },  

        workplanePositionChanged: function(position) {
            this.vertex.parameters.x = position.x;
            this.vertex.parameters.y = position.y;
            this.vertex.parameters.z = position.z;
            this.trigger('parametersChanged');
        },

        ok: function() {
            geometryGraph.graph.removeVertex(this.vertex);
            this.destroy();
        },

        cancel: function() {
            geometryGraph.graph.removeVertex(this.vertex);
            this.destroy();
        },

    });

    var DOMView = Backbone.View.extend({

        className: 'vertex',

        initialize: function() {
            this.render();
            $('body').append(this.$el);
            this.model.on('parametersChanged', this.updateParams, this);
        },

        remove: function() {
            Backbone.View.prototype.remove.call(this);
            this.model.off('parametersChanged', this.updateParams, this);
        },

        events: {
            'click .okcancel .ok' : 'ok',
            'click .okcancel .cancel' : 'cancel',
        },

        render: function() {
            var template = 
                '<div class="title"><img src="/ui/images/icons/point32x32.png"/>' +
                '<div class="name">Vertex</div>' + 
                '<span class="okcancel">' + 
                '<span class="ok button"><img src="/ui/images/icons/ok24x24.png"/></span>' +
                '<span class="cancel button"><img src="/ui/images/icons/cancel24x24.png"/></span>' +
                '</span>' + 
                '</div>' + 
                '<div class="coordinate">' +
                '<span class="x">{{x}}</span><span class="y">{{y}}</span><span class="z">{{z}}</span>' +
                '</div>';
            var view = {
                x: this.model.vertex.parameters.x,
                y: this.model.vertex.parameters.y,
                z: this.model.vertex.parameters.z,
            }
            this.$el.html($.mustache(template, view));
            return this;
        },

        updateParams: function() {
            this.$el.find('.coordinate').find('.x').text(this.model.vertex.parameters.x);
            this.$el.find('.coordinate').find('.y').text(this.model.vertex.parameters.y);
            this.$el.find('.coordinate').find('.z').text(this.model.vertex.parameters.z);
        },

        ok: function() {
            this.model.ok();
        },

        cancel: function() {
            this.model.cancel();
        },

    });

    var VertexSceneView = Backbone.View.extend({

        initialize: function() {
            this.scene = sceneModel.view.scene;
            this.sceneObject = new THREE.Object3D();
            this.model.on('parametersChanged', this.render, this);
        },

        remove: function() {
            this.scene.remove(this.sceneObject);
            this.model.off('parametersChanged', this.render, this);
            sceneModel.view.updateScene = true;
        },

        render: function() {
            this.scene.remove(this.sceneObject);
            this.sceneObject = new THREE.Object3D();

            var cubeCursor = new THREE.Mesh(
                new THREE.CubeGeometry(0.5, 0.5, 0.5, 1, 1, 1), 
                new THREE.MeshBasicMaterial({color: 0xffffff}));
            cubeCursor.position = calc.objToVector(this.model.vertex.parameters);
            this.sceneObject.add(cubeCursor);

            this.scene.add(this.sceneObject);
        },
    });

    var editingModel = undefined;
    geometryGraph.graph.on('vertexAdded', function(vertex) {
        editingModel = new Model(vertex);
    });
    geometryGraph.graph.on('vertexRemoved', function(vertex) {
        editingModel = undefined;
    }, this);


});