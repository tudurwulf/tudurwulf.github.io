###
# Compass
###

# Change Compass configuration
# compass_config do |config|
#   config.output_style = :compact
# end

###
# Page options, layouts, aliases and proxies
###

# Per-page layout changes:
#
# With no layout
# page "/path/to/file.html", :layout => false
#
# With alternative layout
# page "/path/to/file.html", :layout => :otherlayout
#
# A path which all have the same layout
# with_layout :admin do
#   page "/admin/*"
# end

page 'google73448115b5e63721.html', :directory_index => false

# Proxy pages (http://middlemanapp.com/basics/dynamic-pages/)
# proxy "/this-page-has-no-template.html", "/template-file.html", :locals => {
#  :which_fake_page => "Rendering a fake page with a local variable" }

# Automatic image dimensions on image_tag helper
# activate :automatic_image_sizes

activate :directory_indexes

###
# Helpers
###

# Methods defined in the helpers block are available in templates
helpers do
  # Adds class "current" if link points to current URL
  def tab_link_to link, url, opts = {}
    if current_page.url == url_for(url)
      opts[:class] = (opts[:class].to_s << ' current').lstrip
    end
    link_to link, url, opts
  end
end

set :css_dir, 'stylesheets'
set :js_dir, 'javascripts'
set :images_dir, 'images'

# Reload the browser automatically whenever files change
configure :development do
  activate :livereload
  Slim::Engine.set_default_options pretty: true, sort_attrs: false
end

# Build-specific configuration
configure :build do
  activate :minify_html,
    :remove_intertag_spaces => true,
    :remove_http_protocol => false
  activate :minify_css
  activate :minify_javascript

  activate :asset_hash
end
