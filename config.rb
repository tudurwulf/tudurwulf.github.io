set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

activate :directory_indexes

page 'google73448115b5e63721.html', :directory_index => false

configure :development do
  # Reload the browser automatically whenever files change
  activate :livereload

  # Render pretty HTML
  Slim::Engine.set_default_options pretty: true, sort_attrs: false
end

configure :build do
  activate :minify_html,
    :remove_intertag_spaces => true,
    :remove_http_protocol => false
  activate :minify_css, :inline => true
  activate :minify_javascript, :inline => true
end
